// File: src/pages/WishlistPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { animeData } from "../data";
import AnimeCard from "../components/AnimeCard";

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const fetchWishlist = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setWishlist(userSnap.data().wishlist || []);
      }
    };
    fetchWishlist();
  }, [user]);

  const handleRemoveFromWishlist = async (id) => {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      wishlist: arrayRemove(id),
    });
    setWishlist((prev) => prev.filter((animeId) => animeId !== id));
  };

  const filteredAnime = animeData.filter((anime) =>
    wishlist.includes(anime.id)
  );

  return (
    <div className="flex justify-center items-center ">
      <div className="bg-whitelite border-whitegood backdrop-blur shadow h-[40rem] w-[100rem]">
        <div className="flex justify-center">
          {filteredAnime.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              onRemove={handleRemoveFromWishlist}
              isInWishlist={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
