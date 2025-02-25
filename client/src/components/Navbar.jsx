import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between">
      <Link to="/" className="font-bold">Community Connect</Link>
      <div>
        <Link to="/about" className="ml-4">About</Link>
        <Link to="/login" className="ml-4">Login</Link>
        <Link to="/register" className="ml-4">Register</Link>
      </div>
    </nav>
  );
}

export default Navbar;
