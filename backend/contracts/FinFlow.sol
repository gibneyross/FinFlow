// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
// OpenZeppelin imports
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title ReputationNFT-A soulbound NFT
contract ReputationNFT is ERC721URIStorage, Ownable {
	using Counters for Counters.Counter;
	Counters.Counter private _tokenIds;
	// Track whether an address has already minted an associated NFT
	mapping(address => bool) public hasMinted;
	// Track which tokenId is owned by which borrower
	mapping(address => uint256) public tokenIdByOwner;
	constructor() ERC721("FinFlowReputation", "FREP") {}
	/// @notice Mints a new NFT for a borrower with a tokenURI pointing to metadata
	/// @dev Only the contract owner can call this
	function mint(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
		require(!hasMinted[recipient], "NFT previously minted for this address");
		_tokenIds.increment();
		uint256 newItemId= _tokenIds.current();
		_mint(recipient, newItemId);
		_setTokenURI(newItemId,tokenURI);
		hasMinted[recipient] = true;
		tokenIdByOwner[recipient] = newItemId;
		return newItemId;
	}
	/// @dev Prevent NFT transfers
	function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
		internal override
	{
		require(from == address(0), "NFT cannot be transferred.");
		super._beforeTokenTransfer(from, to, tokenId, batchSize);
}
}
/// @title LoanContract - Main lending and repayment logic
contract LoanContract is Ownable {
	/// @notice Loan data structure
	struct Loan {
		address borrower;
		uint256 amount;
		uint256 collateral;
		uint256 dueDate;
		bool repaid;
		bool active;
		address[] lenders;
		uint8 riskCategory;
		uint256 repaidAmount; // Tracks cumulative amount repaid
	}
	// Mapping from loan ID to Loan struct
	mapping(uint256 => Loan) public loans;
	// Tracker contribution per lender
	mapping(uint256 => mapping(address => uint256)) public contributions;
	// Track of loan IDs
	uint256 public loanCounter;
	// Ref to the external NFT contract
	ReputationNFT public nftContract;
	constructor(address _nftAddress) {
		nftContract = ReputationNFT(_nftAddress);
	}
	// Front-end and indexing
	event LoanRequested(uint256 loanId, address borrower, uint256 amount, uint256 collateral, uint8 riskCategory);
	event LoanFunded(uint256 loanId, address lender, uint256 amount);
	event LoanRepaid(uint256 loanId);
	event LoanLiquidated(uint256 loanId);
	/// @notice Borrower requests a loan by submitting amount and collateral
	function requestLoan(uint256 amount, uint256 duration) external payable {
		require(amount > 0, "Loan amount must be positive");
		uint256 collateralRatio = (msg.value * 100) / amount;
		require(collateralRatio >= 10, "At least 10% collateral required");
		uint8 riskCategory;
		if (collateralRatio >= 50) {
			riskCategory = 1;
		} else if (collateralRatio >= 35) {
			riskCategory = 2;
		} else if (collateralRatio >= 20) {
		riskCategory = 3;
		} else {
			riskCategory = 4;
		}
		Loan storage loan = loans[loanCounter];
		loan.borrower = msg.sender;
		loan.amount = amount;
		loan.collateral = msg.value;
		loan.dueDate = block.timestamp + duration;
		loan.repaid = false;
		loan.active = true;
		loan.riskCategory = riskCategory;
		emit LoanRequested(loanCounter, msg.sender, amount, msg.value, riskCategory);
		loanCounter++;
	}
	/// @notice Lenders can contribute ETH to fund a loan. Excess is refunded.
	function fundLoan(uint256 loanId) external payable {
		Loan storage loan = loans[loanId];
		require(loan.active, "Loan is inactive");
		require(!loan.repaid, "Loan already repaid");
		// Prevent funding overdue loans
		require(block.timestamp <= loan.dueDate, "Loan is overdue");
		// Calculate total funded so far
		uint256 totalFunded;
		for (uint256 i = 0; i < loan.lenders.length; i++) {
		totalFunded += contributions[loanId][loan.lenders[i]];
	}
	uint256 remaining = loan.amount > totalFunded ? loan.amount - totalFunded : 0;
	require(remaining > 0, "Loan already fully funded");
	// Accept only what is needed to fully fund the loan
	uint256 accepted = msg.value > remaining ? remaining : msg.value;
	if (contributions[loanId][msg.sender] == 0) {
		loan.lenders.push(msg.sender);
	}
	contributions[loanId][msg.sender] += accepted;
	emit LoanFunded(loanId, msg.sender, accepted);
	// Refund any excess ETH
	if (msg.value > accepted) {
		payable(msg.sender).transfer(msg.value - accepted);
	}
	// Transfer funds to borrower if fully funded
	if (accepted == remaining) {
		payable(loan.borrower).transfer(loan.amount);
	}
	}

	/// @notice Allows full or partial repayments, but final payout/collateral release only on full repayment.
	function repayLoan(uint256 loanId) external payable {
		Loan storage loan = loans[loanId];
		require(msg.sender == loan.borrower, "Not loan borrower");
		require(loan.active, "Loan is inactive");
		require(!loan.repaid, "Loan already repaid");
		require(block.timestamp <= loan.dueDate, "Loan overdue");
	// Calculate total contributions from lenders
	uint256 totalFunded;
	for (uint256 i = 0; i < loan.lenders.length; i++) {
		totalFunded += contributions[loanId][loan.lenders[i]];
	}
	// Reject repayment if the loan is not fully funded
	require(totalFunded >= loan.amount, "Loan not fully funded");
	require(msg.value > 0, "Repayment must be greater than 0");
	// Calculate required total repayment including interest
	uint256 interestRate = 100 + (loan.riskCategory * 2);
	uint256 fullRepaymentAmount = (loan.amount * interestRate) / 100;
	// Track total amount repaid by borrower
	loan.repaidAmount += msg.value;
	// If full repayment reached or exceeded, close loan and payout
	if (loan.repaidAmount >= fullRepaymentAmount) {
		loan.repaid = true;
		loan.active = false;
	// Distribute repayment to lenders proportionally
	for (uint256 i = 0; i < loan.lenders.length; i++) {
		address lender = loan.lenders[i];
		uint256 share = contributions[loanId][lender];
		uint256 payout = (fullRepaymentAmount * share) / loan.amount;
		payable(lender).transfer(payout);
	}
	// Return collateral to borrower
	payable(loan.borrower).transfer(loan.collateral);
	emit LoanRepaid(loanId);
	// Mint reputation NFT if not already minted
	if (!nftContract.hasMinted(msg.sender)) {
		string memory tokenURI;
		if (loan.riskCategory == 1) {
			tokenURI = "https://ipfs.io/ipfs/bafkreibgwf4vwoo2fd6cod7n46ulzvulb5g4yhsrndpzrfez4qjypzhasu";
		} else if (loan.riskCategory == 2) {
			tokenURI = "https://ipfs.io/ipfs/bafkreieb7n674t3apbagyi2tjdpydwockurh5aov72efsjzmkiowpja2ni";
		} else if (loan.riskCategory == 3) {
			tokenURI = "https://ipfs.io/ipfs/bafkreigqafvd7ldbhq6uatj56rrwxnnf7f4n5oj3dmxt6bojfdfqt7st64";
		} else {
			tokenURI = "https://ipfs.io/ipfs/bafkreihjyhufpplgeeik53f6nsyzih7holxkz73dvukk3boctph3swaljq";
		}
		nftContract.mint(msg.sender, tokenURI);
		}
	}
}

	/// @notice Alternative user can liquidate a loan if overdue and unpaid. Collateral is distributed to lenders.
	function liquidateLoan(uint256 loanId) external {
	Loan storage loan = loans[loanId];
	require(block.timestamp > loan.dueDate, "Loan not overdue");
	require(!loan.repaid, "Already repaid");
	require(loan.active, "Loan not active");
	loan.active = false;
	uint256 totalContribution;
	for (uint256 i = 0; i < loan.lenders.length; i++) {
		totalContribution += contributions[loanId][loan.lenders[i]];
	}
	for (uint256 i = 0; i < loan.lenders.length; i++) {
	address lender = loan.lenders[i];
		uint256 share = contributions[loanId][lender];
		uint256 payout = (loan.collateral * share) / totalContribution;
		payable(lender).transfer(payout);
	}
	emit LoanLiquidated(loanId);
	}
	/// @notice Public getter for loan details
	function getLoan(uint256 loanId) external view returns (
		address borrower,
		uint256 amount,
		uint256 collateral,
		uint256 dueDate,
		bool repaid,
		bool active,
		uint8 riskCategory
		) {
		Loan storage loan = loans[loanId];
	return (
		loan.borrower,
		loan.amount,
		loan.collateral,
		loan.dueDate,
		loan.repaid,
		loan.active,
		loan.riskCategory
		);
	}
	/// @notice Public getter for a lender’s contribution to a specific loan
	function getLoanContributions(uint256 loanId, address lender) public view returns (uint256) {
		return contributions[loanId][lender];
	}
	/// @notice Public getter for all lenders in a loan
	function getLenders(uint256 loanId) public view returns (address[] memory) {
	return loans[loanId].lenders;
	}
	function getRepaidAmount(uint256 loanId) public view returns (uint256) {
		return loans[loanId].repaidAmount;
	}
	/// @notice Calculates and returns the total amount contributed to a loan
	function getTotalContributions(uint256 loanId) public view returns (uint256 total) {
		address[] memory lendersList = loans[loanId].lenders;
		for (uint256 i = 0; i < lendersList.length; i++) {
		total += contributions[loanId][lendersList[i]];
		}
	}
}
