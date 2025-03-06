import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="bg-gray-100 w-64 p-4 hidden md:block">
      <nav className="flex flex-col space-y-2">
        <Link to="/home" className="hover:bg-gray-200 p-2 rounded">
          Home
        </Link>
        {/* Add more links as needed */}
        <Link to="/resources" className="hover:bg-gray-200 p-2 rounded">
          Resources
        </Link>
        <Link to="/events" className="hover:bg-gray-200 p-2 rounded">
          Events
        </Link>
        <Link to="/help" className="hover:bg-gray-200 p-2 rounded">
          Help Requests
        </Link>
      </nav>
    </aside>
  );
}
