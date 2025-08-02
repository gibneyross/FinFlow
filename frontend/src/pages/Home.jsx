import { useState } from 'react';
import backgroundImage from '../components/background.png';

function FAQAccordion() {
	const [openIndex, setOpenIndex] = useState(null);
	const toggle = (index) => {
		setOpenIndex(openIndex === index ? null : index);
	};
	const faqs = [
	{
		question: "How does FinFlow work ?",
		answer: "Sign into MetaMask. Borrowers can then request loans by completing the request loan form and locking up collateral. Lenders fund those loans directly on the fund 		loan page, and repayments are automatically handled by smart contracts.",
	},
	{
		question: "How does FinFlow differ from traditional finance ?",
		answer: "FinFlow removes the need for banks, bureaucracy, and credit scores. It uses a risk-based collateral and reputation NFT system to serve the underbanked",
	},
	{
		question: "Who can use FinFlow?",
		answer: "Anyone with Ethereum in a MetaMask wallet can request or fund loans, particularly capital seekers without access to traditional financial systems.",
	},
	{
		question: "What happens if a loan is not repaid by the due date?",
		answer: "If a borrower does not repay a loan by the due date, lenders can manually liquidate the loan on the fund loan page to reclaim the collateral proportional to their contribution.",
	},
 	{
		question: "What is the reputation system?",
		answer: "Borrowers who successfully repay loans receive a non-transferable NFT badge, which improves their credibility for future borrowing.",
 	 },
	{
		question: "What are risk categories and how are they determined?",
		answer: "Risk categories (1–4) are assigned based on the collateral to debt ratio. Higher collateral lowers risk, which reduces required interest on repayments and improves reputation rewards",
 	},
];
	return (
		<div style={{ marginTop: '2rem', width: '100%', maxWidth: '600px' }}>
			<h3>FAQs</h3>
			{faqs.map((faq, index) => (
			<div key={index} style={{ marginBottom: '1rem' }}>
				<button
					onClick={() => toggle(index)}
					style={{
						width: '100%',
						textAlign: 'left',
						padding: '0.75rem',
						backgroundColor: '#add8e6',
						border: 'none',
						borderRadius: '6px',
						fontWeight: 'bold',
						cursor: 'pointer',
					}}
					>
				{faq.question}
				</button>
			{openIndex ===index && (
			<div style={{borderRadius:'6px',backgroundColor:'#e6f2ff'}}>
				<p>{faq.answer}</p>
			</div>
			)}
			</div>
		))}
		</div>
	);
}
function Home() {
	return (
		<div className="centerpage">
			<h2>Welcome to FinFlow</h2>
			<p>
				<strong>FinFlow</strong> is a decentralized lending platform built to replace traditional finance
  				with transparent, blockchain-powered banking. Backed by smart contracts, FinFlow empowers the
  				underbanked and underserved with access to capital—cutting out the middlemen.
   			</p>
			<FAQAccordion />
			<img
				src={backgroundImage}
				alt="FinFlow background"
				style={{
					display: 'block',
					width: '400px',
					maxWidth: '80%',
					pointerEvents: 'none'
				}}
			/>
		</div>
		);
}
export default Home;
