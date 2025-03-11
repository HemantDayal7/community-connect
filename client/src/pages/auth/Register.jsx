import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api"; // Ensure this is correctly set up
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", { name: fullName, email, password });
      alert("Registration successful. Please log in.");
      navigate("/");
    } catch (err) {
      console.error("Registration failed:", err);
      alert("Error registering. Try again.");
    }
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <header className="absolute top-0 left-0 w-full z-50 px-6 py-3">
        <span className="text-3xl font-extrabold italic text-[#69C143]">
          Community Connect
        </span>
      </header>

      {/* REGISTER FORM CONTAINER */}
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-sm">
          {/* Heading */}
          <h1 className="text-2xl font-bold mb-3 text-center">
            Create an account
          </h1>

          {/* Subtitle */}
          <p className="text-base text-gray-700 text-center mb-4">
            Share resources, find local events, and help your neighbourhood!
          </p>

          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded w-full py-2 px-3"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Email Field */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Email address
              </label>
              <input
                type="email"
                className="border border-gray-300 rounded w-full py-2 px-3"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field with Eye Toggle using Heroicons */}
            <div className="mb-4 relative">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="border border-gray-300 rounded w-full py-2 px-3"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              className="bg-[#69C143] text-black w-full py-2 rounded font-semibold hover:bg-[#58AE3A] transition-colors"
            >
              Continue
            </button>
          </form>

          {/* Policies */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By signing up, you agree to our{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>
            ,{" "}
            <a href="#" className="underline">
              Cookie Policy
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Member Agreement
            </a>
            .
          </p>

          {/* Already have an account? */}
          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
