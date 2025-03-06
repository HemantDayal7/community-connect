import React, { useEffect, useState } from "react";
import { fetchPosts } from "../services/feedService";
import FeedItem from "./FeedItem";

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts()
      .then((res) => {
        // Adjust "res.data" based on your backend response shape
        setPosts(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch posts:", err);
      });
  }, []);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedItem key={post._id} post={post} />
      ))}
    </div>
  );
}
