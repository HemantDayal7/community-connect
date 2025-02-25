import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-60 bg-gray-800 text-white min-h-screen p-5">
      <h2 className="text-lg font-bold mb-4">Menu</h2>
      <ul className="space-y-3">
        <li><Link to="/" className="block hover:bg-gray-700 p-2 rounded">Home</Link></li>
        <li><Link to="/about" className="block hover:bg-gray-700 p-2 rounded">About</Link></li>
      </ul>
    </aside>
  );
}

export default Sidebar;
