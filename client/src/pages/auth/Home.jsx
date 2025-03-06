import React from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Feed from "../../components/Feed";
export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Top Navbar */}
      <Navbar />

      {/* Body: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4">
          <Feed />
        </main>
      </div>
    </div>
  );
}
