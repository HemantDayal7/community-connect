import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css"; // Import styles for background animation

const images = [
  "/assets/bg1.jpg",
  "/assets/bg2.jpg",
  "/assets/bg3.jpg",
  "/assets/bg4.jpg",
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bgImage, setBgImage] = useState(images[0]);
  const navigate = useNavigate();

  // Rotate background images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgImage((prev) => images[(images.indexOf(prev) + 1) % images.length]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    // Fake login function for now
    if (email && password) {
      localStorage.setItem("token", "fake-jwt-token");
      navigate("/home"); // Redirect to home after login
    }
  };

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="auth-box">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <button className="auth-button" onClick={handleLogin}>
          Login
        </button>
        <p className="mt-4 text-center">
        Don&apos;t have an account? <Link to="/register" className="text-blue-500">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
