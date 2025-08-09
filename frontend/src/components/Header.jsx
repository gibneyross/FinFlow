import { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import emblem from "./emblem.png";

function Header({ account, connectWallet }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const toggleMenu = () => setMenuOpen((v) => !v);
	const closeMenu = () => setMenuOpen(false);
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

		{/* Hamburger button (shown on small screens) */}
		<button
			className="hamburger"
			aria-label="Toggle menu"
			aria-expanded={menuOpen}
			aria-controls="primary-navigation"
			onClick={toggleMenu}
		>
			<span className="hamburger-line" />
			<span className="hamburger-line" />
			<span className="hamburger-line" />
		</button>

		{/* Primary navigation */}
		<nav
			id="primary-navigation"
			className={`nav ${menuOpen ? "nav--open" : ""}`}
			onClick={closeMenu}
		>
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
