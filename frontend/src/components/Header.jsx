import { Link } from "react-router-dom";
import "./Header.css";
function Header() {
  return (
    <header className="header">
      <h1 className="logo">FinFlow</h1>
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/request-loan">Request Loan</Link>
        <Link to="/fund-loan">Fund Loan</Link>
        <Link to="/repay-loan">Repay Loan</Link>
        <Link to="/reputation">Reputation</Link>
      </nav>
    </header>
  );
}
export default Header;
