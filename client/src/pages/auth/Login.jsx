import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // Use the auth context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await loginUser({ email, password });
      // Update auth state using the context
      await login(data.accessToken, data.user);
      // Navigate after state is updated
      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      window.scrollTo({
        top: featuresSection.offsetTop,
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
              <button className="text-white hover:underline text-lg">
                Public Services
              </button>
              <button className="text-white hover:underline text-lg">
                Business
              </button>
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

      {/* HERO BACKGROUND + LOGIN FORM */}
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
          <h1 className="text-2xl font-bold mb-3 text-center">
            Connect with Your Neighbours
          </h1>
          <p className="text-base text-gray-700 text-center mb-4">
            Share resources, find local events, and help your neighbourhood!
          </p>

          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              disabled={isLoading}
              className={`bg-[#69C143] text-black w-full py-2 rounded font-semibold ${
                isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#58AE3A]"
              } transition-colors text-lg`}
            >
              {isLoading ? "Signing in..." : "Continue"}
            </button>
          </form>

          <div className="text-center mt-3">
            <button
              onClick={handleScrollToFeatures}
              className="text-blue-600 hover:underline"
            >
              Learn more about Community Connect
            </button>
          </div>

          <p className="text-sm text-gray-600 text-center mt-4">
            By logging in, you agree to our{" "}
            <button className="underline">Terms &amp; Conditions</button> and{" "}
            <button className="underline">Privacy Policy</button>.
          </p>

          <p className="text-base text-center mt-4">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="w-full h-screen bg-white flex flex-col items-center justify-center px-4"
      >
        <div className="max-w-4xl w-full text-center">
          <h2 className="text-3xl font-bold mb-6">
            Explore the Power of Community Connect
          </h2>
          <p className="text-base text-gray-700 mb-8 mx-auto">
            Community Connect is a hyper-local platform that brings neighbours
            together for resource sharing, skill exchange, urgent help requests,
            event hosting, and real-time messaging. By reducing waste, promoting
            collaboration, and fostering trust, we empower communities to thrive.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-5xl mb-2">🔧</div>
              <h3 className="text-2xl font-semibold mb-2">Resource Sharing</h3>
              <p className="text-base text-gray-700">
                Borrow and lend everyday items, reduce waste, and help your
                neighbours save money.
              </p>
            </div>
            <div>
              <div className="text-5xl mb-2">💡</div>
              <h3 className="text-2xl font-semibold mb-2">Skill Exchange</h3>
              <p className="text-base text-gray-700">
                Offer or request skills like tutoring, gardening, or repairs,
                fostering a culture of mutual support.
              </p>
            </div>
            <div>
              <div className="text-5xl mb-2">📅</div>
              <h3 className="text-2xl font-semibold mb-2">Event Hosting</h3>
              <p className="text-base text-gray-700">
                Organize local meetups, workshops, or community gatherings to
                bring neighbours closer together.
              </p>
            </div>
          </div>
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
