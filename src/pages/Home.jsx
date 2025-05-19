import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { animeData } from "../data";
import AnimeCard from "../components/AnimeCard";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Home.css";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState([]);
  const animeRefs = useRef([]);

  // Filter out wishlist-exclusive anime from home page
  const animeItems = animeData.filter((anime) => !anime.isWishlistExclusive);

  // Initialize refs
  useEffect(() => {
    animeRefs.current = animeRefs.current.slice(0, animeItems.length);
  }, [animeItems]);

  // Intersection Observer setup with smooth transitions
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = entry.target.dataset.index;
          if (entry.isIntersecting) {
            setVisibleItems((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRefs = animeRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [animeItems]);

  // Fetch wishlist with loading states
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setWishlist(userSnap.data().wishlist || []);
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const handleWishlistAction = async (id, isAdding) => {
    if (!user) {
      navigate("/login", {
        state: {
          redirectAfterLogin: "/",
          [isAdding ? "animeToAdd" : "animeToRemove"]: id,
        },
      });
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        wishlist: isAdding ? arrayUnion(id) : arrayRemove(id),
      });
      setWishlist((prev) =>
        isAdding ? [...prev, id] : prev.filter((animeId) => animeId !== id)
      );
    } catch (error) {
      console.error("Wishlist error:", error);
      alert("Failed to update wishlist. Please try again.");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="main ml-40 flex justify-center max-sm:ml-0"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="main-glass bg-black/60 border-whitegood backdrop-blur shadow-lg h-auto w-113 px-4 mt-32 rounded-xl"
      >
        <div className="mt-12 center-img">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 md:gap-6"
          >
            <AnimatePresence>
              {animeItems.map((anime, index) => (
                <motion.div
                  key={anime.id}
                  ref={(el) => (animeRefs.current[index] = el)}
                  data-index={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  initial="hidden"
                  animate={
                    visibleItems.includes(index.toString())
                      ? "visible"
                      : "hidden"
                  }
                  exit="hidden"
                >
                  <AnimeCard
                    anime={anime}
                    onAdd={() => handleWishlistAction(anime.id, true)}
                    onRemove={() => handleWishlistAction(anime.id, false)}
                    isInWishlist={wishlist.includes(anime.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Home;
