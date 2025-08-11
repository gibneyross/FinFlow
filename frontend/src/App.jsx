import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Import route components
import Home from './pages/Home';
import RequestLoan from './pages/RequestLoan';
import FundLoan from './pages/FundLoan';
import RepayLoan from './pages/RepayLoan';
import Reputation from './pages/Reputation';
// Layout components
import Header from './components/Header';
import Footer from './components/Footer';
// Import compiled smart contract ABIs
import loanContractArtifact from './contracts/LoanContract.json';
import nftContractArtifact from './contracts/ReputationNFT.json';
import './App.css';

const LOAN_CONTRACT_ADDRESS = import.meta.env.VITE_LOAN_CONTRACT;
const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_REPUTATION_CONTRACT;

function App() {
	// React state hooks to store blockchain connection data
	const [provider, setProvider] = useState(null);// Ethers provider
	const [signer, setSigner] = useState(null);// User signer
	const [loanContract, setLoanContract] = useState(null);// Loan smart contract instance
	const [nftContract, setNftContract] = useState(null);// Reputation NFT contract instance
	const [account, setAccount] = useState('');// User wallet address
	const [loading, setLoading] = useState(true);

	const setupBlockchain = async () => {// ensure contracts are always connected with the current signer
		if (!window.ethereum) return null;
		const nextProvider = new ethers.BrowserProvider(window.ethereum);
		const nextSigner = await nextProvider.getSigner();
		const nextLoan = new ethers.Contract(LOAN_CONTRACT_ADDRESS, loanContractArtifact.abi, nextSigner);
		const nextNft  = new ethers.Contract(NFT_CONTRACT_ADDRESS,  nftContractArtifact.abi,  nextSigner);
		return { provider: nextProvider, signer: nextSigner, loan: nextLoan, nft: nextNft };
	};

	// Allow wallet connection via button
	const connectWallet = async () => {
		if (!window.ethereum) {
			alert("Please install MetaMask to connect your wallet.");
			return;
		}
		try {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			const result = await setupBlockchain();
			if (result) {
				setProvider(result.provider);
				setSigner(result.signer);
				setLoanContract(result.loan);
				setNftContract(result.nft);
			}
			setAccount(accounts[0]);
			} catch (err) {
				console.error("User rejected wallet connection or error occurred:", err);
			}
		};

		// Silent wallet detection on page load
		useEffect(() => {
			const init = async () => {
				if (!window.ethereum) {
					console.warn("MetaMask not detected.");
					setLoading(false); // Continue loading anyway
					return;
				}

				try {
					const accounts = await window.ethereum.request({ method: 'eth_accounts' });
					if (accounts.length > 0) {
						const result = await setupBlockchain();
						if (result) {
							setProvider(result.provider);
							setSigner(result.signer);
							setLoanContract(result.loan);
							setNftContract(result.nft);
						}
						setAccount(accounts[0]);
    						console.log("Wallet auto-connected:", accounts[0]);
						} else {
							console.log("No wallet connected yet.");
						}

						// Listen for account changes
						// are signed by the new account (prevents needing a full page reload)
				const onAccountsChanged = async (newAccounts) => {
					if (newAccounts.length > 0) {
						const result = await setupBlockchain();
						if (result) {
							setProvider(result.provider);
							setSigner(result.signer);
							setLoanContract(result.loan);
							setNftContract(result.nft);
						}
						setAccount(newAccounts[0]);
						console.log("Account switched:", newAccounts[0]);
					} else {
						setAccount('');
						setSigner(null);
						setLoanContract(null);
						setNftContract(null);
						console.log("Wallet disconnected");
					}
				};
				window.ethereum.on("accountsChanged", onAccountsChanged);
				const onChainChanged = () => {
					// A full reload is recommended by MetaMask (ensures providers/signers reset cleanly)
					window.location.reload();
				};
				window.ethereum.on("chainChanged", onChainChanged);
				return () => {
					if (window.ethereum?.removeListener) {
						window.ethereum.removeListener("accountsChanged", onAccountsChanged);
						window.ethereum.removeListener("chainChanged", onChainChanged);
					}
				};
						} catch (err) {
							console.error("Silent wallet detection failed:", err);
						} finally {
							setLoading(false); // App should load regardless
						}
				};

				init();
			}, []);

			// Show a loading screen while initializing
 			if (loading) {
				return (
					<div className="loading-screen">
						<h2>FinFlow loading...</h2>
					</div>
				);
			}

			// Render the app
			return (
				<Router>
					<div className="appcontainer">
					{/* Pass connectWallet and account to Header */}
					<Header account={account} connectWallet={connectWallet} />
					<main className="content">
						<Routes>
						<Route path="/" element={<Home />} />
						<Route
							path="/request-loan"
							element={<RequestLoan contract={loanContract} account={account} />}
						/>
						<Route
							path="/fund-loan"
							element={<FundLoan contract={loanContract} account={account} />}
						/>
						<Route
							path="/repay-loan"
							element={<RepayLoan contract={loanContract} account={account} />}
						/>
						<Route
							path="/reputation"
							element={<Reputation contract={nftContract} account={account} />}
						/>
						</Routes>
					</main>
					<Footer />
					</div>
				</Router>
	);
}
export default App;
