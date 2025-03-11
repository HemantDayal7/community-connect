import FeedItem from "./FeedItem";

export default function Feed() {
  // Example feed data
  const feedData = [
    { id: 1, user: "Hemant", text: "Hello from Community Connect!" },
    { id: 2, user: "Alice", text: "Anyone have a ladder I can borrow?" },
  ];

  return (
    <div className="space-y-6 mt-1">
      {/* Post Composer */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <textarea
          className="w-full bg-gray-50 dark:bg-gray-700 rounded p-2 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring focus:ring-[#69C143]"
          placeholder="What's on your mind?"
          rows={3}
        />
        <button className="mt-2 px-4 py-2 bg-[#69C143] text-black rounded hover:bg-[#58AE3A] transition-colors">
          Post
        </button>
      </div>

      {/* Feed Items */}
      {feedData.map((item) => (
        <FeedItem key={item.id} data={item} />
      ))}
    </div>
  );
}
