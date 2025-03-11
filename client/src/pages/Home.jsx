// src/pages/Home.jsx
import Feed from "../components/Feed";
import RightSidebar from "../components/ui/RightSidebar";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 
        The offset is handled by MainLayout (pt-16, ml-64).
        We'll just arrange the center feed + right sidebar in a row.
      */}
      <div className="flex gap-6">
        {/* Expand feed in the center */}
        <div className="flex-1">
          <Feed />
        </div>

        {/* Right sidebar near top-right on large screens */}
        <div className="hidden lg:block w-72">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
