import React from "react";

export default function FeedItem({ post }) {
  return (
    <div className="bg-white shadow p-4 rounded">
      <h2 className="font-bold text-lg">{post.title}</h2>
      <p className="text-gray-700 mt-1">{post.description}</p>
      {/* Additional fields (user, date/time, etc.) */}
    </div>
  );
}
