import API from "./api";

// Example fetch from /resources or /posts endpoint
export const fetchPosts = () => {
  return API.get("/resources");
};

export const createPost = (data) => {
  return API.post("/resources", data);
};
