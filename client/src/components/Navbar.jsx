import React from "react";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <nav className="bg-white shadow-md flex items-center justify-between px-4 py-2">
      <div className="font-bold text-xl">Community Connect</div>
      <div className="flex-1 mx-4">
        <input
          type="text"
          placeholder="Search..."
          className="border border-gray-300 rounded px-2 py-1 w-full"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={handleLogout} className="text-blue-600">
          Logout
        </button>
      </div>
    </nav>
  );
}
