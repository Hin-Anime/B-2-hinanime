import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createSlug } from "../context/utils";

const AnimeCard = ({ anime, onAdd, onRemove, isInWishlist }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="img relative mb-6 md:mb-0 group">
      <Link to={`/anime/${createSlug(anime.title)}`}>
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={anime.imageUrl}
            alt={anime.title}
            className="h-100.1 w-[260px] rounded-md max-sm:h-52 max-sm:w-36"
          />
          {isHovered && (
            <div className="absolute bottom-0 left-1/2 h-100.1 w-[260px] transform -translate-x-1/2 bg-black/30 backdrop-blur-lg text-white p-4 rounded-lg shadow-xl z-20 max-sm:hidden max-md:hidden max-lg:hidden transition-all duration-300 ease-out opacity-0 group-hover:opacity-100">
              <h3 className="text-lg  mb-2">{anime.title}</h3>
              <p className="text-sm mb-2 line-clamp-3">
                {anime.description || "No description available"}
              </p>
              <div className="flex justify-between text-sm">
                <div className="flex flex-col ">
                  <span>Season: {anime.season || "1"}</span>
                  <span>Episodes: {anime.episodes || "Unknown"}</span>
                  <span>Duration: {(anime.animeduration || "24") + "m"}</span>
                </div>
                <div className="flex flex-col">
                  <span>Year: {anime.animeyear || "202X"}</span>
                  <span>Rating: {anime.imdbRating || "0"}/10</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {anime.genres?.map((genre, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-700 rounded-full text-xs transition-colors duration-200 hover:bg-gray-600"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="title custom-font">
          <h2 className="text-white mt-2 -ml-[2.7rem] text-lg w-full text-center max-sm:text-base max-sm:mt-1 max-sm:-ml-0">
            {/* Show full title up to 18 chars on desktop, 15 on mobile */}
            <span className="hidden sm:inline">
              {anime.title.length > 18
                ? `${anime.title.slice(0, 18)}...`
                : anime.title}
            </span>
            <span className="sm:hidden">
              {anime.title.length > 15
                ? `${anime.title.slice(0, 15)}...`
                : anime.title}
            </span>
          </h2>
        </div>
      </Link>
      <div className="flex justify-between mt-2">
        {isInWishlist ? (
          <button
            onClick={() => onRemove(anime.id)}
            className="bg-red-500 text-white text-xs px-2 py-1 rounded"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={() => onAdd(anime.id)}
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
};

export default AnimeCard;
