import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaDiscord,
  FaHome,
  FaInfoCircle,
  FaFilm,
  FaBars,
  FaTimes,
  FaPalette,
  FaUser,
  FaHeart,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaCommentAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import AnimeSearchBar from "./AnimeSearchBar";

const Navbars = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(null);
  const { user, logout, userDetails } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayName = userDetails?.profile?.username;

  // Function to change wallpaper based on screen size
  const changeWallpaper = (urlMobile, urlDesktop, themeName) => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const selectedWallpaper = isMobile ? urlMobile : urlDesktop;
    document.body.style.backgroundImage = `url('${selectedWallpaper}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundRepeat = "no-repeat";
    setActiveTheme(themeName);
  };

  // Toggle the sidebar
  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  // Close navbar on screen resize and set initial wallpaper
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    // Set default wallpaper on first load
    if (!activeTheme) {
      changeWallpaper("", "", "Jujutsu Kaisen");
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeTheme]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 backdrop-blur-lg bg-black bg-opacity-80 border-b border-gray-700 shadow-xl z-30 mb-60">
        <div className="container mx-auto px-4 py-2">
          <AnimeSearchBar />
        </div>
      </div>

      {/* Menu Icon for Mobile */}
      <div className="md:hidden fixed top-5 left-4 z-50">
        <button
          onClick={toggleNavbar}
          className="text-white bg-black bg-opacity-70 p-2 rounded-full hover:bg-opacity-90 transition-all"
          aria-label="Toggle menu"
        >
          {isOpen ? null : <FaBars size={24} />}
          {/* Hide completely when open */}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <header
        className={`fixed z-40 h-full transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-48" : "-translate-x-full w-0"
        } md:translate-x-0 md:w-48`}
      >
        <div className="mt-4 ml-4 md:ml-6">
          <Link to="/" onClick={() => setIsOpen(false)}>
            <img
              src="https://i.postimg.cc/XvdWdLrm/hinanime-logo-removebg-preview.png"
              className="h-16 w-auto relative z-20 hover:opacity-90 transition-opacity"
              alt="Logo"
            />
          </Link>
        </div>
        <nav
          className={`backdrop-blur-lg bg-black bg-opacity-80 border-r border-gray-700 shadow-xl h-full w-full md:w-48 fixed top-0 left-0 flex flex-col items-start pt-24 pb-8  text-white overflow-y-auto`}
        >
          {/* Navigation Links */}
          <ul className="space-y-2 w-full">
            <li>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
              >
                <FaHome className="text-xl" />
                <span className="font-medium">HOME</span>
              </Link>
            </li>
            <li>
              <Link
                to="/movies"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
              >
                <FaFilm className="text-xl" />
                <span className="font-medium">MOVIES</span>
              </Link>
            </li>
            <li>
              <Link
                to="/message"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
              >
                <FaCommentAlt className="text-xl" />
                <span className="font-medium">MESSAGE</span>
              </Link>
            </li>
            {user && (
              <li>
                <Link
                  to="/wishlist"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
                >
                  <FaHeart className="text-xl" />
                  <span className="font-medium">WISHLIST</span>
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
              >
                <FaInfoCircle className="text-xl" />
                <span className="font-medium">ABOUT</span>
              </Link>
            </li>
            <li>
              <a
                href="https://discord.gg/2JBnqk2kne"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
              >
                <FaDiscord className="text-xl" />
                <span className="font-medium">DISCORD</span>
              </a>
            </li>

            {/* User Section */}
            {user ? (
              <>
                <li className="border-t border-gray-700 mt-4 pt-4">
                  <div className="flex items-center space-x-3 py-2 px-4">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <FaUser className="text-white" />
                    </div>
                    <span className="font-medium text-blue-400">
                      Hi, {displayName || "User"}
                    </span>
                  </div>
                </li>
                <li>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
                  >
                    <FaUser className="text-xl" />
                    <span className="font-medium">PROFILE</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-800 hover:text-red-400 transition-colors duration-200"
                  >
                    <FaSignOutAlt className="text-xl" />
                    <span className="font-medium">LOGOUT</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="border-t border-gray-700 mt-4 pt-4">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors duration-200"
                  >
                    <FaSignInAlt className="text-xl" />
                    <span className="font-medium">LOGIN</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    <FaUserPlus className="text-xl" />
                    <span className="font-medium">SIGN UP</span>
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Themes Section */}
          {/* <div className="mt-8 w-full">
            <div className="flex items-center space-x-3 text-gray-300 mb-4 px-4">
              <FaPalette className="text-lg" />
              <span className="font-medium text-sm uppercase tracking-wider">
                Themes
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 w-full px-2">
              <WallpaperLink
                label="Jujutsu Kaisen"
                urlMobile="https://i.postimg.cc/L4tkMLHs/jjk.jpg"
                urlDesktop="https://i.postimg.cc/6p3Pg2rY/jujutsu-kaisen.jpg"
                changeWallpaper={changeWallpaper}
                isActive={activeTheme === "Jujutsu Kaisen"}
              />
              <WallpaperLink
                label="One Piece"
                urlMobile="https://i.postimg.cc/zB23KFwc/1006847.jpg"
                urlDesktop="https://i.postimg.cc/50ckXsZR/one-piece.jpg"
                changeWallpaper={changeWallpaper}
                isActive={activeTheme === "One Piece"}
              />
              <WallpaperLink
                label="Demon Slayer"
                urlMobile="https://i.postimg.cc/G3ZGfbYS/1007935.jpg"
                urlDesktop="https://i.postimg.cc/2yrcwVjd/kyojuro-rengoku.jpg"
                changeWallpaper={changeWallpaper}
                isActive={activeTheme === "Demon Slayer"}
              />
              <WallpaperLink
                label="Mountain"
                urlMobile="https://i.postimg.cc/cJ3FGQrM/mountain-mobile.jpg"
                urlDesktop="https://i.postimg.cc/cJ3FGQrM/montai.jpg"
                changeWallpaper={changeWallpaper}
                isActive={activeTheme === "Mountain"}
              />
            </div> 
          </div>*/}
        </nav>
      </header>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

// Wallpaper Link Component
const WallpaperLink = ({
  label,
  urlMobile,
  urlDesktop,
  changeWallpaper,
  isActive,
}) => (
  <button
    className={`w-full text-left py-2 px-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-gray-800 hover:bg-gray-700 text-white hover:text-blue-400"
    }`}
    onClick={() => changeWallpaper(urlMobile, urlDesktop, label)}
  >
    {label}
  </button>
);

export default Navbars;
