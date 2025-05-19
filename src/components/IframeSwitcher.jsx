import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const episodes = [
  {
    url: "https://drive.google.com/file/d/18h576uR9NL7RVi0z6seZ0sUpQk90dclU/preview",
    title: "Episode 1: The Beginning",
  },
  {
    url: "https://example.com/source4",
    title: "Episode 2: The Journey",
  },
  {
    url: "https://example.com/source5",
    title: "Episode 3: The Battle",
  },
  {
    url: "https://example.com/source5",
    title: "Episode 3: The Battle",
  },
  {
    url: "https://example.com/source5",
    title: "Episode 3: The Battle",
  },
];

const IframeSwitcher = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 < episodes.length ? prevIndex + 1 : prevIndex
    );
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 >= 0 ? prevIndex - 1 : prevIndex
    );
  };

  return (
    <div className="flex flex-col items-center p-4 w-full relative">
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl"
        style={{ backgroundImage: `url('https://via.placeholder.com/1500')` }}
      ></div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-4xl h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] border rounded-lg overflow-hidden"
      >
        <iframe
          src={episodes[currentIndex].url}
          className="w-full h-full"
          allowFullScreen
          title={episodes[currentIndex].title}
        ></iframe>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="relative flex mt-4 text-white backdrop-blur-lg p-4 rounded-lg">
        {/* Episode Name */}
        <h2 className="h-10 w-97 bg-gray-800 px-4 py-2 rounded-lg mr-2">
          {episodes[currentIndex].title}
        </h2>
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <motion.button
              onClick={handlePrevious}
              className="h-10 flex items-center justify-center gap-2 bg-gray-800 px-4 py-2 rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaArrowLeft className="text-lg" /> Previous (Ep {currentIndex})
            </motion.button>
          )}
          {currentIndex < episodes.length - 1 && (
            <motion.button
              onClick={handleNext}
              className="h-10 flex items-center enter justify-center gap-2 bg-gray-800 px-4 py-2 rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Next (Ep {currentIndex + 2}) <FaArrowRight className="text-lg" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IframeSwitcher;
