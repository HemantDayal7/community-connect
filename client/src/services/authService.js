import api from "./api";

export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/api/v1/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};
