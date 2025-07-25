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
// Import Style
import './App.css';
// Replace with current deployed contract addresses
const LOAN_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const NFT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

function App() {
  // React state hooks to store blockchain connection data
  const [provider, setProvider] = useState(null);             // Ethers provider
  const [signer, setSigner] = useState(null);                 // User signer
  const [loanContract, setLoanContract] = useState(null);     // Loan smart contract instance
  const [nftContract, setNftContract] = useState(null);       // Reputation NFT contract instance
  const [account, setAccount] = useState('');                 // User wallet address

  // Auto-connect wallet and contracts
  useEffect(() => {
    const connectWallet = async () => {
      // Check for MetaMask
      if (!window.ethereum) {
        alert('MetaMask not detected');
        console.warn('MetaMask not detected in browser.');
        return;
      }
      try {
        console.log('Connecting to wallet...');
        // Prompt MetaMask to connect to wallet
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Create ethers provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log('Wallet connected:', address);
        // Create instances of smart contracts using signer
        const loan = new ethers.Contract(
          LOAN_CONTRACT_ADDRESS,
          loanContractArtifact.abi,
          signer
        );
        const nft = new ethers.Contract(
          NFT_CONTRACT_ADDRESS,
          nftContractArtifact.abi,
          signer
        );
        console.log('LoanContract connected at:', LOAN_CONTRACT_ADDRESS);
        console.log('NFTContract connected at:', NFT_CONTRACT_ADDRESS);
        // Store connected objects in React state
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        setLoanContract(loan);
        setNftContract(nft);
      } catch (err) {
        console.error('Error connecting to wallet or contracts:', err);
      }
    };
    connectWallet();
  }, []);
  // Show a loading screen while contracts and wallet are initializing
  if (!loanContract || !nftContract || !account) {
    return (
      <div className="loading-screen">
        <h2>FinFlow loading...</h2>
      </div>
    );
  }
  // Render the main app with routing
  return (
    <Router>
      <div className="app-container">
        <Header />
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
