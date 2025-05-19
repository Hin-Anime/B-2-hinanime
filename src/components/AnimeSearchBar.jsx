// src/components/AnimeSearchBar.jsx
import React, { useState, useEffect, useRef } from "react";
import { animeData } from "../data";
import { Link } from "react-router-dom";

import "./AnimeSearchBar.css";

const AnimeSearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }

    const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

    const filtered = animeData
      .map((anime) => {
        const title = anime.title.toLowerCase();
        const year = anime.animeyear?.toString() || "";
        const duration = anime.animeduration?.toString() || "";
        let score = 0;

        // Exact title match
        if (title === searchTerm.toLowerCase()) {
          score += 100;
        }

        // Title word matches
        searchWords.forEach((word) => {
          if (title.startsWith(word)) {
            score += 30;
          } else if (title.includes(` ${word}`)) {
            score += 20;
          } else if (title.includes(word)) {
            score += 10;
          }

          // Year match
          if (year.includes(word)) {
            score += 15;
          }

          // Duration match (e.g., searching "24" could match 24m episodes)
          if (duration.includes(word)) {
            score += 5;
          }
        });

        return { ...anime, score };
      })
      .filter((anime) => anime.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setResults(filtered);
  }, [searchTerm]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsFocused(false);
    } else if (e.key === "Enter" && results.length > 0) {
      window.location.href = results[0].animeUrl || "#";
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "24m";
    return minutes > 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes}m`;
  };

  return (
    <div className="anime-search-container" ref={searchRef}>
      <div className={`anime-search-bar ${isFocused ? "focused" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search anime..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="search-input"
          aria-haspopup="listbox"
          aria-expanded={isFocused && results.length > 0}
        />
      </div>

      {isFocused && results.length > 0 && (
        <div
          className="search-results-dropdown"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((anime) => (
            <Link
              key={anime.id}
              to={`/anime/${anime.id}`}
              className="search-result-item"
              role="option"
              aria-selected="false"
            >
              <img
                src={anime.imageUrl}
                alt={anime.title}
                className="anime-thumbnail"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/80x120?text=No+Image";
                }}
              />
              <div className="result-content">
                <h4>{anime.title}</h4>
                <div className="meta-info">
                  <span>{anime.animeyear || "2024"}</span>
                  <span>•</span>

                  <span>{formatDuration(anime.animeduration)}</span>
                </div>
                <div className="genres">
                  {anime.genres?.slice(0, 3).map((genre) => (
                    <span key={genre} className="genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
          <div className="view-all-results">
            <Link to={`/search?q=${encodeURIComponent(searchTerm)}`}>
              View all results (
              {
                animeData.filter(
                  (a) =>
                    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.animeyear?.toString().includes(searchTerm) ||
                    a.animeduration?.toString().includes(searchTerm)
                ).length
              }
              )
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimeSearchBar;
