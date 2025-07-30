import { useEffect, useState } from "react";
import { ethers } from "ethers";
import reputationArtifact from "../contracts/ReputationNFT.json";
const NFT_CONTRACT_ADDRESS = "0x4c68aF0060269620a9151b8f8CADfE9Ca7200F92";
const NFT_ABI = reputationArtifact.abi;

function ReputationStatus() {
	const [tokenURI, setTokenURI] = useState(null); // Stores the URI of the user's NFT
	const [hasMinted, setHasMinted] = useState(false); // Tracks whether the user has received a reputation NFT
	const [error, setError] = useState(""); // Holds any error message to display to the user

 	 useEffect(() => {
		const fetchNFTData = async () => {
		if (!window.ethereum) return;
		try {
			const [account]=await window.ethereum.request({ method: "eth_requestAccounts" });
			const provider= new ethers.BrowserProvider(window.ethereum);
			const signer =await provider.getSigner();
			const nftContract= new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
			const minted= await nftContract.hasMinted(account);
			setHasMinted(minted);
		if (minted) {
			let found = false;
			for (let tokenId = 1; tokenId <= 100 && !found; tokenId++) {
				try {
					const owner = await nftContract.ownerOf(tokenId);
					if (owner.toLowerCase() === account.toLowerCase()) {
					const uri = await nftContract.tokenURI(tokenId);
					setTokenURI(uri);
					found = true;
				}
			} catch {}
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
	// Helper to describe badge based on token URI
	const getBadgeDescription = (uri) => {
		if (!uri) return "";

		if (uri.includes("bafkreibgwf4vwoo2fd6cod7n46ulzvulb5g4yhsrndpzrfez4qjypzhasu")) {
			return {
				level: "Excellent",
				details: "This badge reflects extremely strong credit worthiness and high collateral coverage."
			};
		} else if (uri.includes("bafkreieb7n674t3apbagyi2tjdpydwockurh5aov72efsjzmkiowpja2ni")){
		return {
			level: "Good",
			details: "This badge represents a responsible borrower with solid collateral backing and good repayment history."
		};
		} else if (uri.includes("bafkreigqafvd7ldbhq6uatj56rrwxnnf7f4n5oj3dmxt6bojfdfqt7st64")) {
		return {
			level: "Fair",
			details: "This badge shows a moderate risk borrower with acceptable collateral with little repayment history."
		};
		} else if (uri.includes("bafkreihjyhufpplgeeik53f6nsyzih7holxkz73dvukk3boctph3swaljq")){
		return {
			level: "At Risk",
			details: "This badge signals higher risk borrower based on low collateral availability."
		};
		} else {
		return {
			level: "Unknown",
			details: "This badge is not recognized or may use an unsupported metadata URI."
		};
	}
};
	const badgeInfo = getBadgeDescription(tokenURI);
	return (
		<div className="nftstatus">
			{error && <p>{error}</p>}
			{!hasMinted && !error && (
			<p>No reputation badge has been earned yet.</p>
		)}
		{hasMinted && tokenURI && (
		<div>
		<h3>My Reputation Badge</h3>
		<img
			src={tokenURI}
			alt="Reputation Badge"
			width="200"
			style={{ borderRadius: "10px", marginBottom: "1rem"}}
		/>
		<p>Level: {badgeInfo.level}</p>
			<p>{badgeInfo.details}</p>
		</div>
   		   )}
		</div>
	);
}
export default ReputationStatus;
