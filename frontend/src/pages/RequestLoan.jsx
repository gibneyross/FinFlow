import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function RequestLoan({ contract, account }) {
	// Form input states
	const [amount, setAmount] = useState('');
	const [duration, setDuration] = useState('');
	const [durationUnit, setDurationUnit] = useState('days');
	const [collateral, setCollateral] = useState('');
	// UI feedback and calculated values
	const [status, setStatus] = useState('');
	const [minCollateral, setMinCollateral] = useState(0);
	const [riskCategory, setRiskCategory] = useState(null);
	const [interestRate, setInterestRate] = useState(null);
	const [totalRepayment, setTotalRepayment] = useState(null);

	// Automatically recalculate risk category and repayment amount on input change
	useEffect(() =>{
		const amountVal =parseFloat(amount);
		const collateralVal = parseFloat(collateral);
		// If loan amount is not valid, reset all derived fields
		if (!amountVal || isNaN(amountVal)) {
			setMinCollateral(0);
			setRiskCategory(null);//Prevents risk category rendering until loan amount entered
			setInterestRate(null);
			setTotalRepayment(null);
			return;
		}
		// Calculate minimum collateral required (>10% of requested amount)
		const min = amountVal * 0.10;
		setMinCollateral(min);
		// Determine collateral ratio
		const collateralRatio = collateralVal > 0 ? (collateralVal * 100) / amountVal : 0;
 		   // Assign risk category based on collateral ratio
		let category = 4;
		if (collateralRatio >= 50) category = 1;
		else if (collateralRatio >= 35) category = 2;
		else if (collateralRatio >= 20) category = 3;
		setRiskCategory(category);
		// Calculate interest rate and total repayment
		const rate = 100 + (category * 2);
		setInterestRate(rate);
		setTotalRepayment((amountVal * rate) / 100);
 		}, [amount, collateral]);
		// Converts user-specified duration into seconds
		const convertDurationToSeconds = () => {
		const value = parseInt(duration);
		if (isNaN(value)) return 0;
		const multiplier = {
			days: 86400,
			weeks: 604800,
			months: 2592000,//Approx 30 days
			years: 31536000,
		};
		return value * multiplier[durationUnit];
		};
		// Handles the loan request submission
		const handleRequestLoan = async (e) => {
		e.preventDefault();
		if (!contract) {
			setStatus('Smart contract not connected');
			return;
		}
		try {
			setStatus('Submitting loan request...');
			const tx = await contract.requestLoan(
				ethers.parseEther(amount),
				convertDurationToSeconds(),
				{
				value: ethers.parseEther(collateral),
				}
			);
			await tx.wait();
			setStatus('Loan requested successfully.');
			} catch (error){
				console.error('Loan request failed:', error);
				setStatus('Failed to submit loan request.');
			}
		};
		// Show loading state if contracts are not connected yet
		if (!contract || !account) {
			return <p>Connecting to contract...</p>;
		}
		return (
			<div className="request-loan" style={{ maxWidth:'500px', margin: '0 auto' }}>
 			<h2>Loan Request Form</h2>
			<form onSubmit={handleRequestLoan} style={{display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			{/* Loan amount input */}
			<label>
				Loan Amount (ETH):
				<input
					type="number"
					step="0.01"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					required
				/>
			</label>
			<label>
				Duration:
				<div style={{display: 'flex', gap: '0.5rem'}}>
					<input
						type="number"
						value={duration}
						onChange={(e) => setDuration(e.target.value)}
						required
					/>
					<select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}>
						<option value="days">Days</option>
						<option value="weeks">Weeks</option>
						<option value="months">Months</option>
						<option value="years">Years</option>
					</select>
				</div>
			</label>
			{/* Collateral input with minimum value displayed*/}
			<label>
				Collateral Available (ETH): <span style={{ fontSize: '0.9rem', color: 'grey', paddingRight: '8px' }}>( Min: {minCollateral.toFixed(3)} ETH </span>
				<input
					type="number"
					step="0.01"
					value={collateral}
					onChange={(e) => setCollateral(e.target.value)}
					required
				/>
			</label>
			{/* Dynamic risk/repayment preview box*/}
			{riskCategory && (
				<div style={{ background: '#e6f2ff', padding: '1rem', borderRadius:'6px' }}>
					<p><strong>Risk Category:</strong> {riskCategory}</p>
					<p><strong>Interest Rate:</strong> {interestRate}%</p>
					<p><strong>Total Repayment Required:</strong> {totalRepayment?.toFixed(4)} ETH</p>
				</div>
			)}
			<button type="submit">Submit Loan Request</button>
		</form>
		{/* Status message*/}
		<p>{status}</p>
	</div>
	);
}
export default RequestLoan;
