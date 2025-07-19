import { useEffect, useState } from "react";
import { ethers } from "ethers";
import reputationArtifact from "../contracts/ReputationNFT.json";
const NFT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const NFT_ABI = reputationArtifact.abi;

function ReputationStatus() {
  const [tokenURI, setTokenURI] = useState(null);// Stores the URI of the user's NFT
  const [hasMinted, setHasMinted] = useState(false);// Tracks whether the user has received a reputation NFT
  const [error, setError] = useState("");// Holds any error message to display to the user
  useEffect(() => {
    const fetchNFTData = async () => {
      if (!window.ethereum) return; // Ensure MetaMask or another wallet is available
      try {
        // Request the connected wallet address
        const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        // Initialize contract instance
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
        // Check if the user has previously minted a reputation NFT
        const minted = await nftContract.hasMinted(account);
        setHasMinted(minted);
        if (minted) {
          // Attempt to find the user's token by scanning token IDs
          let found = false;
          for (let tokenId = 1; tokenId <= 100 && !found; tokenId++) {
            try {
              const owner = await nftContract.ownerOf(tokenId);
              if (owner.toLowerCase() === account.toLowerCase()) {
                const uri = await nftContract.tokenURI(tokenId);
                setTokenURI(uri);
                found = true;
              }
            } catch (err) {
            }
          }
          if (!found) {
            setError("Token ID could not be located.");
          }
        }
      } catch (err) {
        console.error("Error fetching NFT data", err);
        setError("Error loading reputation badge.");
      }
    };
    fetchNFTData();
  }, []);

  return (
    <div className="nftstatus">
      {/* Display error message if any */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {/* Show message if the user has not earned a badge */}
      {!hasMinted && !error && (
        <p>No reputation badge has been earned yet.</p>
      )}
      {/* If user has a badge, display the image and URI */}
      {hasMinted && tokenURI && (
        <div>
          <img
            src={tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")}
            alt="Reputation Badge"
            width="200"
          />
          <p><small>Token URI: {tokenURI}</small></p>
        </div>
      )}
    </div>
);
}
export default ReputationStatus;
