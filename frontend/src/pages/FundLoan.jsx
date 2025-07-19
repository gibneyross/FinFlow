import { useEffect, useState } from "react";
import { ethers } from "ethers";
import reputationArtifact from "../contracts/ReputationNFT.json";

const NFT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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
  useEffect(() => {
    const setupNFT = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
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
      for (let i = 0; i < loanCount; i++) {
        const loan = await contract.getLoan(i);
        const contribution = await contract.getLoanContributions(i, account);
        const [borrower, amount, collateral, dueDate, repaid, active, riskCategory] = loan;
        // Get the associated NFT for the borrower if available
        try {
          const tokenId = await nftContract.tokenIdByOwner(borrower);
          const tokenURI = await nftContract.tokenURI(tokenId);
          const imageUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
          badges[borrower] = imageUrl;
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
  return (
    <div>
      <h2>Available Loans For Funding</h2>
      {loans.length === 0 && <p>No active loans available to fund. Return shortly.</p>}
      {loans.map((loan) => (
        <div key={loan.id} className="loan-box">
          <p><strong>Loan #{loan.id}</strong></p>
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
          <p>Active: {loan.active ? "Yes" : "No"}</p>
          <p>Risk Category: {loan.riskCategory}</p>
          {/* Only allow funding if loan is active */}
          {loan.active && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fundLoan(loan.id, e.target.elements.amount.value);
              }}
            >
              <input
                name="amount"
                placeholder="Amount in ETH"
                required
                style={{ padding: "0.5rem", marginRight: "0.5rem" }}
              />
              <button type="submit">Fund</button>
            </form>
          )}
        </div>
      ))}
      <p style={{ marginTop: "1rem", color: "lightgrey" }}>{status}</p>
    </div>
  );
}
export default FundLoan;
