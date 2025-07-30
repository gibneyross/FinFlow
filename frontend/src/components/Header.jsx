import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import emblem from "./emblem.png";

function Header() {
	const [account, setAccount] =useState(null);// Holds the connected wallet address
	// Automatically check if MetaMask is already connected
	useEffect(() => {
	const checkConnection = async () => {
		if (window.ethereum) {
		try {
			const accounts = await window.ethereum.request({
				method: "eth_accounts",
			});
		if (accounts.length > 0) {
			setAccount(accounts[0]); // Set account if already connected
		}
	} catch (error) {
		console.error("Error checking wallet connection:",error);
		}
	}
	};
    checkConnection();
  }, []);
	// Prompt MetaMask connection on user click
	const connectWallet = async ()=>{
		if (window.ethereum) {
		try {
			const accounts = await window.ethereum.request({
				method: "eth_requestAccounts",
			});
		setAccount(accounts[0]); // Set connected account
		console.log("Connected wallet:", accounts[0]);
		} catch (error) {
			console.error("MetaMask connection rejected:", error);
		}
		} else {
   			   alert("Please install MetaMask to use FinFlow.");
		}
	};
	return (
		<header className="header">
			<h1 className="logo">
			<img
				src={emblem}
				alt="FinFlow Emblem"
				style={{
				width: "64px",
				height:"64px",
				marginRight: "8px",
				verticalAlign: "middle",
			}}
       			 />
      		 		 FinFlow
     			 </h1>
	{/* Navigation with wallet display */}
	<nav className="nav" style={{ display: "flex", alignItems:"center", gap: "1rem" }}>
		<Link to="/">Home</Link>
		<Link to="/request-loan">Request Loan</Link>
		<Link to="/fund-loan">Fund Loan</Link>
		<Link to="/repay-loan">Repay Loan</Link>
		<Link to="/reputation">Reputation</Link>
		{/* Show wallet connection button or address */}
		{!account ? (
			<button onClick={connectWallet} style={{padding: "0.4rem 0.8rem"}}>
				Connect Wallet
			</button>
		) : (
		// NEW: Display the connected wallet inline with nav links
		<span style={{ fontWeight: "bold"}}>
			Connected Wallet: {account.slice(0, 6)}...{account.slice(-4)}
		</span>
		)}
	</nav>
	</header>
	);
}
export default Header;
