import React from "react";
import CommentSystem from "./CommentSystem";
export default function Hello() {
  return (
    <div className="">
      <h1>hello this is test </h1>
      <CommentSystem
        episodeId="naruto-episode-2"
        animeTitle="Naruto Episode 2"
      />
    </div>
  );
}
