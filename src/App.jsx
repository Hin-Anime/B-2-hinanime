// src/App.jsx or wherever you define your routes
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Wishlist from "./components/Wishlist";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateRoute from "./components/PrivateRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import IframeSwitcher from "./components/IframeSwitcher";
import Message from "./pages/Anime/Message";

import AnimePage from "./components/AnimePage";
import "./fonts/Helvetica-Bold.ttf";

import "./fonts/Helvetica-Light.ttf";
import "./fonts/Helvetica-Italic.ttf";
import "./fonts/Helvetica-BoldItalic.ttf";
import "./fonts/Helvetica.ttf";

import "./index.css";
import CommentSystem from "./pages/Anime/CommentSystem";

function App() {
  return (
    <>
      <Router>
        <Navbar />
        {/* Add the SearchBar component here */}
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
          <h1 className="text-white text-4xl underline">Hello Tailwind</h1>
        </div>
        <Routes>
          <Route path="/anime/:titleSlug" element={<AnimePage />} />

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/message" element={<Message />} />
          <Route path="/iframe" element={<IframeSwitcher />} />
          <Route path="/hello" element={<CommentSystem />} />
          {/* Add other routes here */}

          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Private Route for Wishlist */}
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
