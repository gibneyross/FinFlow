import { useEffect, useState } from "react";
import { ethers } from "ethers";
import reputationArtifact from "../contracts/ReputationNFT.json";
const NFT_CONTRACT_ADDRESS = "0x4c68aF0060269620a9151b8f8CADfE9Ca7200F92";
const NFT_ABI = reputationArtifact.abi;

function FundLoan({ contract, account }) {
	// Hold all loan data
	const [loans, setLoans] = useState([]);
	const [status, setStatus] = useState("");
	// Connected NFT contract instance
	const [nftContract, setNftContract] = useState(null);
	// Maps borrower addresses to their reputation
	const [borrowerBadges, setBorrowerBadges] = useState({});
	// Connect to the ReputationNFT contract on load
	useEffect(()=>{
		const setupNFT = async ()=> {
		const provider= new ethers.BrowserProvider(window.ethereum);
		const signer =await provider.getSigner();
		const nft= new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
		setNftContract(nft);
	};
	setupNFT();
	}, []);
	// Fetch loan data
	useEffect(() => {
		if (contract && nftContract) {
			fetchLoans();
		}
	}, [contract, nftContract]);

	// Load all loans from the LoanContract and match borrowers to NFTs
	const fetchLoans = async () => {
		try {
			const loanCount = await contract.loanCounter();
			const fetchedLoans = [];
			const badges = {};
		for (let i =0; i < loanCount; i++) {
			const loan = await contract.getLoan(i);
			// NEW: Fetch total contributions regardless of connected account
			const contribution = await contract.getTotalContributions(i);
			const [borrower, amount, collateral, dueDate, repaid, active, riskCategory] = loan;
			// Get the associated NFT for the borrower if available
     		try {
			const tokenId = await nftContract.tokenIdByOwner(borrower);
			const tokenURI = await nftContract.tokenURI(tokenId);
			badges[borrower] = tokenURI;
		} catch {
			// Borrower does not have an NFT
			badges[borrower] = null;
		}
        // Store loan details
		fetchedLoans.push({
			id: i,
			borrower,
			amount,
			collateral,
			dueDate,
			repaid,
			active,
			riskCategory,
			contribution
		});
	}
		setLoans(fetchedLoans);
		setBorrowerBadges(badges);
	} catch (err) {
		console.error("Error loading loans:", err);
	}
};
	// Handle the loan funding action
	const fundLoan = async (loanId, amount) => {
		setStatus("Funding loan...");
	try {
		const tx = await contract.fundLoan(loanId, {
		value: ethers.parseEther(amount),
	});
		await tx.wait();
		setStatus("Loan funded successfully.");
		fetchLoans(); // Refresh the loan list
	} catch (err) {
		console.error(err);
		setStatus("Funding failed.");
	}
};
	// Handle liquidation of overdue loans
	const liquidateLoan = async (loanId) => {
		setStatus("Liquidating loan...");
  	try {
		const tx = await contract.liquidateLoan(loanId);
		await tx.wait();
		setStatus("Loan liquidated successfully.");
		fetchLoans(); // Refresh loan list after liquidation
		} catch (err) {
			console.error(err);
		setStatus("Liquidation failed.");
		}
	};
	return (
		<div className="centerpage">
			<h2>Available Loans For Funding</h2>
			{loans.length === 0 && <p>No active loans available to fund. Return shortly.</p>}
			{loans.map((loan) => {
				// Calculate remaining fundable amount
				const remaining = parseFloat(ethers.formatEther(
				BigInt(loan.amount) - BigInt(loan.contribution)
			));
				// Determine if the loan is overdue
				const isOverdue = Date.now() > Number(loan.dueDate) * 1000;
				// NEW: Check if connected account is among lenders for this loan
				const isFunder = loan.contribution > 0;
			return (
				<div key={loan.id} className="loanlist">
					<p><strong>Loan {loan.id}</strong></p>
					<p><strong>Borrower:</strong> {loan.borrower}</p>
					{/* Show borrower's NFT badge if available */}
					{borrowerBadges[loan.borrower] && (
						<img
							src={borrowerBadges[loan.borrower]}
							alt="Reputation Badge"
							width="100"
							style={{ marginBottom: '0.5rem', borderRadius: '6px' }}
						/>
					)}
					<p>Amount: {ethers.formatEther(loan.amount)} ETH</p>
					<p>Collateral: {ethers.formatEther(loan.collateral)} ETH</p>
					<p>Due: {new Date(Number(loan.dueDate) * 1000).toLocaleString()}</p>
					<p>Repaid: {loan.repaid ? "Yes" : "No"}</p>
					<p>Active: {loan.active && Date.now() < Number(loan.dueDate) * 1000 ? "Yes" : "No"}</p>
					<p>Fully Funded: {BigInt(loan.contribution) >= BigInt(loan.amount) ? "Yes" : "No"}</p>
					<p>Risk Category: {loan.riskCategory}</p>

					{/* Show how much of the loan has been funded so far */}
					<p>
						Funded: {ethers.formatEther(loan.contribution)} / {ethers.formatEther(loan.amount)} ETH
					</p>
					{/* Only allow funding if loan is active and not overdue */}
					{loan.active && !isOverdue && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							fundLoan(loan.id, e.target.elements.amount.value);
						}}
					>
					<input
						name="amount"
						type="number"
						step="0.0001"
						placeholder="Amount in ETH"
						required
						// Set max value to prevent overfunding
						max={remaining}
						style={{ padding: "0.5rem", marginRight: "0.5rem" }}
					/>
						<button type="submit">Fund</button>
					</form>
				)}
				{/* If loan is overdue */}
				{loan.active && isOverdue && (
				<>
					<p style={{ color: "black" }}>
						This loan is overdue and can no longer be funded.
					</p>
					{/* Only show Liquidate button if the current user is a funder */}
					{isFunder ? (
					<button onClick={() => liquidateLoan(loan.id)} style={{ marginTop: "0.5rem" }}>
						Liquidate Loan
					</button>
					) : (
					// Message for users who are not lenders
					<p>
						Only funders can liquidate overdue loans.
					</p>
					)}
				</>
				)}
				</div>
			);
		})}
		<p style={{ marginTop: "1rem", color: "black" }}>{status}</p>
		</div>
		);
}
export default FundLoan;
