import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email, password);

      // Handle successful login
      const animeToAdd = location.state?.animeToAdd;
      if (animeToAdd) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          wishlist: arrayUnion(animeToAdd),
        });
      }

      navigate(location.state?.redirectAfterLogin || "/");
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/wrong-password") {
        setError("Wrong password");
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative w-full max-w-md px-6 py-8">
        {/* Anime girl image */}

        {/* Glassmorphism form container */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="px-10 py-12">
            <h2 className="text-3xl font-bold text-center text-white mb-8 font-[Anime] tracking-wider">
              Welcome Back!
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-100 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 focus:border-pink-400 focus:ring-2 focus:ring-pink-300/30 text-white placeholder-white/60 outline-none transition duration-200"
                  />
                </div>

                <div>
                  <input
                    value={password}
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 focus:border-pink-400 focus:ring-2 focus:ring-pink-300/30 text-white placeholder-white/60 outline-none transition duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="#"
                className="text-sm text-white/70 hover:text-white transition duration-200"
              >
                Forgot password?
              </a>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-overlay filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/4 -left-10 w-24 h-24 bg-purple-500 rounded-full mix-blend-overlay filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
    </div>
  );
};

export default Login;
