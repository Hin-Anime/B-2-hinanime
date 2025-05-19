// src/components/SearchResults.jsx
import React from "react";
import { animeData } from "../data";
import { Link } from "react-router-dom";

const SearchResults = ({ searchTerm }) => {
  const filteredAnime = animeData.filter(
    (anime) =>
      anime.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anime.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="search-results">
      {filteredAnime.map((anime) => (
        <Link
          key={anime.id}
          to={anime.animeUrl}
          className="anime-result"
          rel="noopener noreferrer"
        >
          <img src={anime.imageUrl} alt={anime.title} />
          <div className="anime-info">
            <h3>{anime.title}</h3>
            <p>{anime.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default SearchResults;
