import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api"; // Adjust path if needed

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Invalid credentials");
    }
  };

  // Custom smooth scroll to the #features section
  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      const offsetTop = featuresSection.offsetTop;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* TOP NAVBAR (Transparent Black Strip) */}
      <header className="absolute top-0 left-0 w-full z-50">
        <div className="flex items-center justify-between px-6 py-3 bg-black/20 backdrop-blur-sm border-b border-white/20">
          {/* Left side: brand + nav links */}
          <div className="flex items-center space-x-6">
            <span className="text-3xl font-extrabold italic text-[#69C143]">
              Community Connect
            </span>
            <nav className="flex items-center space-x-4">
              <button
                onClick={handleScrollToFeatures}
                className="text-white hover:underline text-lg"
              >
                Features
              </button>
              <a href="#" className="text-white hover:underline text-lg">
                Public Services
              </a>
              <a href="#" className="text-white hover:underline text-lg">
                Business
              </a>
            </nav>
          </div>

          {/* Right side: bright green "Log In" button with black text */}
          <div>
            <button className="bg-[#69C143] text-black px-4 py-2 rounded hover:bg-[#58AE3A] transition-colors text-lg">
              Log In
            </button>
          </div>
        </div>
      </header>

      {/* HERO BACKGROUND + LOGIN FORM (Full screen) */}
      <div
        className="relative w-full h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/src/assets/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* White box container for login */}
        <div className="relative z-10 max-w-sm w-full bg-white rounded-lg shadow-md p-6 mx-4 mt-16">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-3 text-center">
            Connect with Your Neighbours
          </h1>

          {/* Subtitle */}
          <p className="text-base text-gray-700 text-center mb-4">
            Share resources, find local events, and help your neighbourhood!
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label className="block text-gray-700 text-base font-semibold mb-1">
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

            {/* Password Field with Toggle */}
            <div className="mb-4 relative">
              <label className="block text-gray-700 text-base font-semibold mb-1">
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
              {/* Eye Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-600"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <button
              type="submit"
              className="bg-[#69C143] text-black w-full py-2 rounded font-semibold hover:bg-[#58AE3A] transition-colors text-lg"
            >
              Continue
            </button>
          </form>

          {/* Disclaimer */}
          <p className="text-sm text-gray-600 text-center mt-4">
            By logging in, you agree to our{" "}
            <a href="#" className="underline">
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>
            .
          </p>

          {/* Link to Register => "Register" */}
          <p className="text-base text-center mt-4">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* FEATURES SECTION => Full screen as well */}
      <section
        id="features"
        className="w-full h-screen bg-white flex flex-col items-center justify-center px-4"
      >
        {/* Container for content */}
        <div className="max-w-4xl w-full text-center">
          {/* Headline / Title */}
          <h2 className="text-3xl font-bold mb-6">
            Explore the Power of Community Connect
          </h2>

          {/* Project Overview */}
          <p className="text-base text-gray-700 mb-8 mx-auto">
            Community Connect is a hyper-local platform that brings neighbours
            together for resource sharing, skill exchange, urgent help requests,
            event hosting, and real-time messaging. By reducing waste, promoting
            collaboration, and fostering trust, we empower communities to
            thrive.
          </p>

          {/* Three Core Features with Icons => center them horizontally */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div>
              <div className="text-5xl mb-2">🔧</div>
              <h3 className="text-2xl font-semibold mb-2">Resource Sharing</h3>
              <p className="text-base text-gray-700">
                Borrow and lend everyday items, reduce waste, and help your
                neighbours save money.
              </p>
            </div>
            {/* Feature 2 */}
            <div>
              <div className="text-5xl mb-2">💡</div>
              <h3 className="text-2xl font-semibold mb-2">Skill Exchange</h3>
              <p className="text-base text-gray-700">
                Offer or request skills like tutoring, gardening, or repairs,
                fostering a culture of mutual support.
              </p>
            </div>
            {/* Feature 3 */}
            <div>
              <div className="text-5xl mb-2">📅</div>
              <h3 className="text-2xl font-semibold mb-2">Event Hosting</h3>
              <p className="text-base text-gray-700">
                Organize local meetups, workshops, or community gatherings to
                bring neighbours closer together.
              </p>
            </div>
          </div>

          {/* Call-to-action */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-3">
              Instantly connect with your neighbourhood
            </h3>
            <Link
              to="/register"
              className="bg-[#69C143] text-black px-6 py-2 rounded font-semibold hover:bg-[#58AE3A] transition-colors inline-block text-lg"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
