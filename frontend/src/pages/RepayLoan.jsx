import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function RepayLoan({ contract, account }) {
	const [loanId, setLoanId] = useState('');
	const [loanDetails, setLoanDetails] = useState(null);
	const [repaymentAmount, setRepaymentAmount] = useState('');
	const [status, setStatus] = useState('');
	const [repaidSoFar, setRepaidSoFar] = useState('');
	const [isFullyFunded, setIsFullyFunded] = useState(true);
	const [maxRepayable, setMaxRepayable] = useState('');//max repayment amount

	useEffect(() => {
		const fetchLoan = async () => {
			if (!contract || loanId === '')return;
			try{
				const loan = await contract.getLoan(loanId);
				const [
					borrower,
					amount,
					collateral,
					dueDate,
					repaid,
					active,
					riskCategory
			] = loan;
			const parsedLoan = {
				borrower,
				amount: BigInt(amount),
				collateral: BigInt(collateral),
				dueDate: Number(dueDate),
				repaid,
				active,
				riskCategory: Number(riskCategory)
		};
		setLoanDetails(parsedLoan);
		// Check total funding
		let totalFunded = 0n;
		const lenders = await contract.getLenders(loanId);
		for (const lender of lenders) {
			const contribution = await contract.getLoanContributions(loanId, lender);
			totalFunded += BigInt(contribution);
		}
		// Check if fully funded
		if (totalFunded < parsedLoan.amount) {
			setStatus("This loan has not been fully funded. Repayment is disabled.");
			setIsFullyFunded(false);
		} else {
			setIsFullyFunded(true);
			setStatus("");
		}
		// Calculate full repayment amount
		const interestRate = 100 + parsedLoan.riskCategory * 2;
		const fullRepayment = (parsedLoan.amount * BigInt(interestRate)) / 100n;
		// Check repaid so far
		const repaidValue = await contract.getRepaidAmount(loanId);
		setRepaidSoFar(ethers.formatEther(repaidValue));
		// Remaining to repay
		const remaining = fullRepayment - repaidValue;
		setRepaymentAmount(ethers.formatEther(remaining));
		setMaxRepayable(ethers.formatEther(remaining)); // Save for input cap
		} catch (err) {
			console.error('Failed to fetch loan', err);
			setLoanDetails(null);
			setRepaymentAmount('');
			setRepaidSoFar('');
			setIsFullyFunded(true);
			setMaxRepayable('');
		}
	};
	fetchLoan();
	}, [loanId, contract]);
	const repayLoan = async (e) => {
		e.preventDefault();
		if (!contract || !repaymentAmount) {
			setStatus('Missing contract or repayment amount');
			return;
		}
		if (!isFullyFunded) {
			setStatus('Cannot repay. This loan is not fully funded.');
			return;
  		  }
		try {
			setStatus('Sending repayment...');
			const tx = await contract.repayLoan(loanId, {
			value: ethers.parseEther(repaymentAmount),
   		   });
		await tx.wait();
		setStatus('Loan repaid successfully');
		} catch (err) {
			console.error(err);
			setStatus('Repayment failed. ' + (err.reason || err.message));
		}
	};
	return (
  		<div className="repayloan" style={{maxWidth:'600px', margin:'0 auto' }}>
			<h2>Loan Repayment Form</h2>
			<form onSubmit={repayLoan} style={{ display:'flex', flexDirection: 'column', gap:'1rem'}}>
			<label>
				Loan ID :
			<input
				type="number"
				placeholder=" Enter Loan ID"
				value={loanId}
				onChange={(e) =>setLoanId(e.target.value)}
				required
			/>
			</label>
	{loanDetails && (
		<div style={{ background: '#e6f2ff', padding: '1rem', borderRadius:'8px' }}>
			<p><strong>Borrower:</strong> {loanDetails.borrower}</p>
			<p><strong>Amount:</strong> {ethers.formatEther(loanDetails.amount)} ETH</p>
			<p><strong>Due Date:</strong> {new Date(loanDetails.dueDate * 1000).toLocaleString()}</p>
			<p><strong>Repaid:</strong> {loanDetails.repaid ? 'Yes' : 'No'}</p>
			<p><strong>Risk Category:</strong> {loanDetails.riskCategory}</p>
			<p><strong>Current Repaid Amount:</strong> {repaidSoFar} / {maxRepayable} ETH</p>
		</div>
        )}
	<label>
		Repayment Amount (ETH) :
		<input
			type="number"
			step="0.01"
		placeholder=" Enter Repayment Amount"
         		value={repaymentAmount}
			max={maxRepayable}
			onChange={(e) => {
				const entered = parseFloat(e.target.value);
				const remaining = parseFloat(maxRepayable);
			if (entered > remaining) {
				setStatus(`You cannot repay more than the remaining amount: ${maxRepayable} ETH`);
			} else {
				setStatus('');
				setRepaymentAmount(e.target.value);
			}
		}}
		required
		/>
	</label>
	<button type="submit" disabled={!isFullyFunded}>Repay Loan</button>
	</form>
	<p style={{marginTop: '1rem', color: 'black' }}>{status}</p>
	</div>
	);
}
export default RepayLoan;
