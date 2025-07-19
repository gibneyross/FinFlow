import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function RepayLoan({ contract, account }) {
  const [loanId, setLoanId] = useState('');
  const [loanDetails, setLoanDetails] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [status, setStatus] = useState('');
  // Fetch loan details based on loanId
  useEffect(() => {
    const fetchLoan = async () => {
      if (!contract || loanId === '') return;
      try {
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
        // Calculate repayment (100% + 2% per risk level)
        const interestRate = 100 + parsedLoan.riskCategory * 2;
        const repayment = (parsedLoan.amount * BigInt(interestRate)) / 100n;
        setRepaymentAmount(ethers.formatEther(repayment));
      } catch (err) {
        console.error('Failed to fetch loan', err);
        setLoanDetails(null);
        setRepaymentAmount('');
      }
    };
    fetchLoan();
  }, [loanId, contract]);
  // Submit repayment to smart contract
  const repayLoan = async (e) => {
    e.preventDefault();
    if (!contract || !repaymentAmount) {
      setStatus('Missing contract or repayment amount');
      return;
    }
    try {
      setStatus('Sending repayment...');
      const tx=await contract.repayLoan(loanId, {
        value:ethers.parseEther(repaymentAmount),
      });
      await tx.wait();
      setStatus('Loan repaid successfully');
    } catch (err) {
      console.error(err);
      setStatus('Repayment failed. ' + (err.reason || err.message));
    }
  };

  return (
    <div className="repayloan" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Loan Repayment Form</h2>
      <form onSubmit={repayLoan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Loan ID :
          <input
            type="number"
            placeholder=" Enter Loan ID"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            required
          />
        </label>
        {/* Show loan details*/}
        {loanDetails && (
          <div style={{ background: 'lightgrey', padding: '1rem', borderRadius: '8px' }}>
            <p><strong>Borrower:</strong> {loanDetails.borrower}</p>
            <p><strong>Amount:</strong> {ethers.formatEther(loanDetails.amount)} ETH</p>
            <p><strong>Due Date:</strong> {new Date(loanDetails.dueDate * 1000).toLocaleString()}</p>
            <p><strong>Repaid:</strong> {loanDetails.repaid ? 'Yes' : 'No'}</p>
            <p><strong>Risk Category:</strong> {loanDetails.riskCategory}</p>
            <p><strong>Required Repayment:</strong> {repaymentAmount} ETH</p>
          </div>
        )}
      <label>
          Repayment Amount (ETH) :
         <input
            type="number"
            step="0.01"
            placeholder=" Enter Repayment Amount"
            value={repaymentAmount}
            onChange={(e) => setRepaymentAmount(e.target.value)}
            required
          />
        </label>
        <button type="submit">Repay Loan</button>
      </form>
      {/* Status feedback */}
      <p style={{ marginTop: '1rem', color: 'black' }}>{status}</p>
    </div>
  );
}
export default RepayLoan;
