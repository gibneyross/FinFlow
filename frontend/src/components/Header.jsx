import { Link } from "react-router-dom";
import "./Header.css";
import emblem from "./emblem.png";

function Header({ account, connectWallet }) {
	return (
		<header className="header">
			<h1 className="logo">
				<img
					src={emblem}
					alt="FinFlow Emblem"
					style={{
						width: "64px",
						height: "64px",
						marginRight: "8px",
						verticalAlign: "middle",
					}}
				/>
				FinFlow
			</h1>

			<nav className="nav" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
				<Link to="/">Home</Link>
				<Link to="/request-loan">Request Loan</Link>
				<Link to="/fund-loan">Fund Loan</Link>
				<Link to="/repay-loan">Repay Loan</Link>
				<Link to="/reputation">Reputation</Link>

				{/* Wallet connection */}
				{!account ? (
					<button onClick={connectWallet} style={{ padding: "0.4rem 0.8rem" }}>
						Connect Wallet
					</button>
				) : (
					<span style={{ fontWeight: "bold" }}>
						Connected Wallet: {account.slice(0, 6)}...{account.slice(-4)}
					</span>
				)}
			</nav>
		</header>
	);
}

export default Header;
