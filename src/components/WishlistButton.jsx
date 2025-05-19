// src/components/WishlistButton.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import "../styles/WishlistButton.css"; // Assuming you have a CSS file for styling
const WishlistButton = ({ animeId }) => {
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Check if anime is already in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setIsInWishlist(userSnap.data().wishlist?.includes(animeId));
      }
    };
    checkWishlist();
  }, [user, animeId]);

  const handleWishlistToggle = async () => {
    if (!user) {
      alert("Please login to add to wishlist!");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    try {
      if (isInWishlist) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(animeId),
        });
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(animeId),
        });
      }
      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  return (
    <button
      onClick={handleWishlistToggle}
      className={isInWishlist ? "wishlist-active" : "wishlist-inactive"}
    >
      {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    </button>
  );
};

export default WishlistButton;
