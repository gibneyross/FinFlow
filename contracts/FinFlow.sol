// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/utils/Counters.sol";

/// @title ReputationNFT - Handles NFT for borrowers
contract ReputationNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(address => bool) public hasMinted;
    constructor() ERC721("FinFlowReputation", "FREP") {}

    function mint(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        require(!hasMinted[recipient], "Already minted for this address");
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        hasMinted[recipient] = true;
        return newItemId;
    }
    function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
) internal override {
    require(from == address(0), "Soulbound: cannot transfer");
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
}
}
/// @title LoanContract - Handles lending
contract LoanContract is Ownable {
    struct Loan {
        address borrower;
        uint256 amount;
        uint256 collateral;
        uint256 dueDate;
        bool repaid;
        bool active;
        address[] lenders;
    }
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    uint256 public loanCounter;
    ReputationNFT public nftContract;

    constructor(address _nftAddress) {
        nftContract = ReputationNFT(_nftAddress);
    }
    event LoanRequested(uint256 loanId, address borrower, uint256 amount, uint256 collateral);
    event LoanFunded(uint256 loanId, address lender, uint256 amount);
    event LoanRepaid(uint256 loanId);

    function requestLoan(uint256 amount, uint256 duration) external payable {
        require(msg.value > 0, "Collateral required");

        Loan storage loan = loans[loanCounter];
        loan.borrower = msg.sender;
        loan.amount = amount;
        loan.collateral = msg.value;
        loan.dueDate = block.timestamp + duration;
        loan.active = true;

        emit LoanRequested(loanCounter, msg.sender, amount, msg.value);
        loanCounter++;
    }

    function fundLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan inactive");

        loan.lenders.push(msg.sender);
        contributions[loanId][msg.sender] += msg.value;

        emit LoanFunded(loanId, msg.sender, msg.value);

        uint256 totalFunded;
        for (uint256 i = 0; i < loan.lenders.length; i++) {
            totalFunded += contributions[loanId][loan.lenders[i]];
        }

     if (totalFunded >= loan.amount) {
            payable(loan.borrower).transfer(loan.amount);
       }
    }
    function repayLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(msg.sender == loan.borrower, "Not borrower");
        require(loan.active, "Loan inactive");
        require(!loan.repaid, "Already repaid");
        require(block.timestamp <= loan.dueDate, "Loan overdue");

        uint256 repaymentAmount = loan.amount;
        require(msg.value >= repaymentAmount, "Insufficient repayment");

        for (uint256 i = 0; i < loan.lenders.length; i++) {
            address lender = loan.lenders[i];
            uint256 share = contributions[loanId][lender];
            uint256 payout = (repaymentAmount * share) / loan.amount;
            payable(lender).transfer(payout);
        }

        loan.repaid = true;
        loan.active = false;
        payable(loan.borrower).transfer(loan.collateral);
        emit LoanRepaid(loanId);
        if (!nftContract.hasMinted(msg.sender)) {
            nftContract.mint(msg.sender, "ipfs://QmExampleReputationBadge");
        }
    }
    function getLoanContributions(uint256 loanId, address lender) public view returns (uint256) {
        return contributions[loanId][lender];
   }
}
