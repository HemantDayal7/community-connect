export default function RightSidebar() {
  return (
    <div className="space-y-8">
      {/* Invite Neighbors */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-2">Invite Neighbors</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Send invitations to join the platform.
        </p>
        <button className="mt-2 px-4 py-2 bg-[#69C143] text-black rounded hover:bg-[#58AE3A] transition-colors">
          Invite
        </button>
      </div>

      {/* Trending Topics */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="text-md font-bold mb-2">Trending Topics</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Any relevant info or ads here.
        </p>
      </div>
    </div>
  );
}
