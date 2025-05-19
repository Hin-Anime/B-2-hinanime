import React from "react";
import {
  AiFillYoutube,
  AiOutlineClose,
  AiOutlineMessage,
  AiOutlineLike,
  AiFillLike,
  AiOutlineDislike,
  AiFillDislike,
} from "react-icons/ai";
import { FaArrowLeft, FaArrowRight, FaReply } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  query,
  setDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { animeData } from "../data";
import { motion, AnimatePresence } from "framer-motion";

export default function Main({ id }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isInWishlist, setIsInWishlist] = React.useState(false);
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = React.useState(0);
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState("");
  const [loadingComments, setLoadingComments] = React.useState(true);
  const [userProfiles, setUserProfiles] = React.useState({});
  const [profilePopup, setProfilePopup] = React.useState(null);
  const [replyingTo, setReplyingTo] = React.useState(null);
  const [replyContent, setReplyContent] = React.useState("");
  const [activeComment, setActiveComment] = React.useState(null);
  const [animeLikes, setAnimeLikes] = React.useState(0);
  const [animeDislikes, setAnimeDislikes] = React.useState(0);
  const [userReaction, setUserReaction] = React.useState(null);

  const episodes = [
    {
      url: "https://drive.google.com/file/d/18h576uR9NL7RVi0z6seZ0sUpQk90dclU/preview",
      title: "Episode 1: The Beginning",
    },
    {
      url: "https://example.com/source4",
      title: "Episode 2: The Journey",
    },
  ];

  const anime = animeData.find((item) => String(item.id) === String(id));

  const fetchUserProfile = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profileData = userSnap.data().profile || {};
        return {
          ...profileData,
          userId,
          username:
            profileData.username ||
            userSnap.data().email?.split("@")[0] ||
            "Anonymous",
          photoURL: profileData.photoURL || null,
          bannerURL: profileData.bannerURL || null,
          bio: profileData.bio || "",
          createdAt:
            profileData.createdAt?.toDate() ||
            userSnap.data().metadata?.creationTime ||
            new Date(),
        };
      }
      return {
        userId,
        username: "Anonymous",
        photoURL: null,
        bannerURL: null,
        bio: "",
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        userId,
        username: "Anonymous",
        photoURL: null,
        bannerURL: null,
        bio: "",
        createdAt: new Date(),
      };
    }
  };

  const handleProfileClick = async (userId) => {
    const profile = await fetchUserProfile(userId);
    setProfilePopup(profile);
  };

  const handleAnimeReaction = async (reaction) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const animeRef = doc(db, "anime", String(id));
      const animeSnap = await getDoc(animeRef);

      // Initialize document if it doesn't exist
      if (!animeSnap.exists()) {
        await setDoc(animeRef, {
          likes: [],
          dislikes: [],
          likeCount: 0,
          dislikeCount: 0,
        });
      }

      const data = animeSnap.data() || {};
      const currentLikes = data.likes || [];
      const currentDislikes = data.dislikes || [];
      const isLiked = currentLikes.includes(user.uid);
      const isDisliked = currentDislikes.includes(user.uid);

      let updates = {};

      if (reaction === "like") {
        if (isLiked) {
          // Remove like
          updates = {
            likes: arrayRemove(user.uid),
            likeCount: (data.likeCount || 0) - 1,
          };
        } else {
          // Add like
          updates = {
            likes: arrayUnion(user.uid),
            likeCount: (data.likeCount || 0) + 1,
          };
          // Remove dislike if exists
          if (isDisliked) {
            updates.dislikes = arrayRemove(user.uid);
            updates.dislikeCount = (data.dislikeCount || 0) - 1;
          }
        }
      } else {
        if (isDisliked) {
          // Remove dislike
          updates = {
            dislikes: arrayRemove(user.uid),
            dislikeCount: (data.dislikeCount || 0) - 1,
          };
        } else {
          // Add dislike
          updates = {
            dislikes: arrayUnion(user.uid),
            dislikeCount: (data.dislikeCount || 0) + 1,
          };
          // Remove like if exists
          if (isLiked) {
            updates.likes = arrayRemove(user.uid);
            updates.likeCount = (data.likeCount || 0) - 1;
          }
        }
      }

      await updateDoc(animeRef, updates);
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const handleCommentReaction = async (commentId, reaction) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const commentRef = doc(db, "anime", String(id), "comments", commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const data = commentSnap.data();
        const currentLikes = data.likes || [];
        const currentDislikes = data.dislikes || [];
        const isLiked = currentLikes.includes(user.uid);
        const isDisliked = currentDislikes.includes(user.uid);

        let updates = {};

        if (reaction === "like") {
          if (isLiked) {
            // Remove like
            updates = {
              likes: arrayRemove(user.uid),
              likeCount: (data.likeCount || 0) - 1,
            };
          } else {
            // Add like
            updates = {
              likes: arrayUnion(user.uid),
              likeCount: (data.likeCount || 0) + 1,
            };
            // Remove dislike if exists
            if (isDisliked) {
              updates.dislikes = arrayRemove(user.uid);
              updates.dislikeCount = (data.dislikeCount || 0) - 1;
            }
          }
        } else {
          if (isDisliked) {
            // Remove dislike
            updates = {
              dislikes: arrayRemove(user.uid),
              dislikeCount: (data.dislikeCount || 0) - 1,
            };
          } else {
            // Add dislike
            updates = {
              dislikes: arrayUnion(user.uid),
              dislikeCount: (data.dislikeCount || 0) + 1,
            };
            // Remove like if exists
            if (isLiked) {
              updates.likes = arrayRemove(user.uid);
              updates.likeCount = (data.likeCount || 0) - 1;
            }
          }
        }

        await updateDoc(commentRef, updates);
      }
    } catch (error) {
      console.error("Error reacting to comment:", error);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;

    try {
      const profile = await fetchUserProfile(user.uid);
      const commentsRef = collection(db, "anime", String(id), "comments");

      await addDoc(commentsRef, {
        text: replyContent,
        userId: user.uid,
        username: profile.username,
        userPhoto: profile.photoURL,
        timestamp: serverTimestamp(),
        parentId,
        isReply: true,
        likes: [],
        dislikes: [],
        likeCount: 0,
        dislikeCount: 0,
      });

      setReplyContent("");
      setReplyingTo(null);
      setActiveComment(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !id) return;

    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const profile = await fetchUserProfile(user.uid);
      const commentsRef = collection(db, "anime", String(id), "comments");

      await addDoc(commentsRef, {
        text: newComment,
        userId: user.uid,
        username: profile.username || user.email?.split("@")[0] || "Anonymous",
        userPhoto: profile.photoURL || user.photoURL || null,
        timestamp: serverTimestamp(),
        likes: [],
        dislikes: [],
        likeCount: 0,
        dislikeCount: 0,
        parentId: null,
        isReply: false,
      });

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate("/login", {
        state: { redirectAfterLogin: window.location.pathname },
      });
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      if (isInWishlist) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(id),
        });
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(id),
        });
      }
      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  React.useEffect(() => {
    const checkWishlist = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setIsInWishlist(userSnap.data().wishlist?.includes(id));
      }
    };
    checkWishlist();
  }, [user, id]);

  React.useEffect(() => {
    if (!id) return;

    // Load anime reactions with realtime updates
    const animeRef = doc(db, "anime", String(id));
    const unsubscribeAnime = onSnapshot(animeRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setAnimeLikes(data.likeCount || 0);
        setAnimeDislikes(data.dislikeCount || 0);

        if (user) {
          setUserReaction(
            data.likes?.includes(user.uid)
              ? "like"
              : data.dislikes?.includes(user.uid)
              ? "dislike"
              : null
          );
        }
      } else {
        // Initialize if document doesn't exist
        setAnimeLikes(0);
        setAnimeDislikes(0);
        setUserReaction(null);
      }
    });

    // Load comments with realtime updates
    setLoadingComments(true);
    const commentsRef = collection(db, "anime", String(id), "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));

    const unsubscribeComments = onSnapshot(
      q,
      async (snapshot) => {
        const commentsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            if (!userProfiles[data.userId]) {
              const profile = await fetchUserProfile(data.userId);
              setUserProfiles((prev) => ({ ...prev, [data.userId]: profile }));
            }
            return {
              id: doc.id,
              ...data,
              username:
                userProfiles[data.userId]?.username ||
                data.username ||
                "Anonymous",
              userPhoto:
                userProfiles[data.userId]?.photoURL || data.userPhoto || null,
              timestamp: data.timestamp?.toDate(),
              likes: data.likes || [],
              dislikes: data.dislikes || [],
              likeCount: data.likeCount || 0,
              dislikeCount: data.dislikeCount || 0,
            };
          })
        );

        const mainComments = commentsData.filter((c) => !c.parentId);
        const replies = commentsData.filter((c) => c.parentId);

        const organizedComments = mainComments.map((comment) => ({
          ...comment,
          replies: replies
            .filter((reply) => reply.parentId === comment.id)
            .sort((a, b) => a.timestamp - b.timestamp),
        }));

        setComments(organizedComments);
        setLoadingComments(false);
      },
      (error) => {
        console.error("Error loading comments:", error);
        setLoadingComments(false);
      }
    );

    return () => {
      unsubscribeAnime();
      unsubscribeComments();
    };
  }, [id, user]);

  const getYouTubeId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = anime?.youtube ? getYouTubeId(anime.youtube) : null;

  const handleNextEpisode = () => {
    setCurrentEpisodeIndex((prev) =>
      prev + 1 < episodes.length ? prev + 1 : prev
    );
  };

  const handlePrevEpisode = () => {
    setCurrentEpisodeIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
  };

  if (!id)
    return <div className="text-center py-20">Anime ID not provided</div>;
  if (!anime) return <div className="text-center py-20">Anime not found</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-10">
      {/* Profile Popup */}
      <AnimatePresence>
        {profilePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setProfilePopup(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Banner */}
              <div className="h-40 bg-gradient-to-r from-purple-900 to-blue-800">
                {profilePopup.bannerURL && (
                  <img
                    src={profilePopup.bannerURL}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Profile Content */}
              <div className="p-6 relative">
                {/* Profile Picture */}
                <div
                  className="absolute -top-16 left-6 border-4 border-gray-800 rounded-full cursor-pointer"
                  onClick={() => handleProfileClick(profilePopup.userId)}
                >
                  <img
                    src={
                      profilePopup.photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    }
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </div>

                {/* Profile Info */}
                <div className="mt-16">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {profilePopup.username}
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Joined{" "}
                        {new Date(profilePopup.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    {user?.uid === profilePopup.userId && (
                      <button
                        className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full"
                        onClick={() => navigate("/profile")}
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-300">
                      About
                    </h3>
                    <p className="text-gray-300 mt-2">
                      {profilePopup.bio ||
                        "This user hasn't written a bio yet."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Anime Info Section */}
        <div className="ml-60 flex flex-col lg:flex-row gap-8 mb-10 mt-16 max-sm:ml-0 max-xl:ml-0">
          {/* Left Column - Anime Poster */}
          <div className="w-full lg:w-1/3 xl:w-1/4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative rounded-xl overflow-hidden shadow-2xl"
            >
              <img
                className="w-full h-auto object-cover"
                src={anime.imageUrl}
                alt={anime.title}
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/300x450?text=No+Image")
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition"
                >
                  <AiFillYoutube size={20} />
                  <span>Play Trailer</span>
                </button>
              </div>
            </motion.div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={handleWishlistToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                  isInWishlist
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
              >
                {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
              </button>
            </div>
          </div>

          {/* Right Column - Anime Info */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-bold">{anime.title}</h1>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                  IMDB: {anime.imdbRating}
                </span>
              </div>
            </div>

            {/* Anime Reactions */}
            <motion.div
              className="flex items-center gap-4 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                onClick={() => handleAnimeReaction("like")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                  userReaction === "like"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userReaction === "like" ? (
                  <AiFillLike className="text-xl" />
                ) : (
                  <AiOutlineLike className="text-xl" />
                )}
                <span>{animeLikes}</span>
              </motion.button>

              <motion.button
                onClick={() => handleAnimeReaction("dislike")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                  userReaction === "dislike"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userReaction === "dislike" ? (
                  <AiFillDislike className="text-xl" />
                ) : (
                  <AiOutlineDislike className="text-xl" />
                )}
                <span>{animeDislikes}</span>
              </motion.button>
            </motion.div>

            <div className="flex flex-wrap gap-2 mt-4">
              {anime.genres?.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">
                {anime.description || "No description available."}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-400">Language</h3>
                <p className="font-medium">Hindi Dubbed</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-400">Quality</h3>
                <p className="font-medium">1080p, 720p, 480p</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-400">Duration</h3>
                <p className="font-medium">
                  {anime.animeduration || 24}m per ep
                </p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-400">Status</h3>
                <p className="font-medium">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Episode Player Section */}
        <div className="mb-10 ml-60 max-sm:ml-0">
          <h2 className="text-2xl font-bold mb-4">Watch Now</h2>
          <div className="flex flex-col items-center p-4 w-full relative">
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30"
              style={{ backgroundImage: `url('${anime.imageUrl}')` }}
            ></div>

            <motion.div
              key={currentEpisodeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="relative w-full max-w-4xl h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] border rounded-lg overflow-hidden"
            >
              <iframe
                src={episodes[currentEpisodeIndex].url}
                className="w-full h-full"
                allowFullScreen
                title={episodes[currentEpisodeIndex].title}
              ></iframe>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="relative flex mt-4 text-white backdrop-blur-lg p-4 rounded-lg max-sm:mt-6">
              <h2 className="h-auto w-auto lg:w-97 bg-gray-800 px-4 py-2 rounded-lg mr-2 max-sm:text-sm">
                {episodes[currentEpisodeIndex].title}
              </h2>
              <div className="flex gap-2">
                {currentEpisodeIndex > 0 && (
                  <motion.button
                    onClick={handlePrevEpisode}
                    className="h-10 flex items-center justify-center gap-2 bg-gray-800 px-4 py-2 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaArrowLeft className="text-lg" /> Previous
                  </motion.button>
                )}
                {currentEpisodeIndex < episodes.length - 1 && (
                  <motion.button
                    onClick={handleNextEpisode}
                    className="h-10 flex items-center justify-center gap-2 bg-gray-800 px-4 py-2 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    Next <FaArrowRight className="text-lg" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Episodes List Section */}
        <div className="mt-8 ml-60 max-sm:ml-0">
          <h2 className="text-2xl font-bold mb-4">Episodes</h2>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center">
              <img
                src={anime.imageUrl}
                alt="Season cover"
                className="w-16 h-16 object-cover rounded"
              />
              <div className="ml-4">
                <h3 className="font-bold">
                  Season {Math.ceil(anime.episodes / 12)}
                </h3>
                <p className="text-sm text-gray-400">
                  {anime.episodes} Episodes • {anime.animeyear}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Comments Section */}
        <div className="mt-8 ml-60 max-sm:ml-0">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Discussion ({comments.length})
              </h2>
              <div className="flex items-center gap-2">
                <AiOutlineMessage className="text-gray-400" />
                <span className="text-gray-400">
                  {comments.reduce(
                    (acc, curr) => acc + 1 + curr.replies.length,
                    0
                  )}{" "}
                  total
                </span>
              </div>
            </div>

            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex items-start gap-4">
                  <div
                    className="relative cursor-pointer"
                    onClick={() => handleProfileClick(user.uid)}
                  >
                    <img
                      src={
                        user.photoURL ||
                        userProfiles[user?.uid]?.photoURL ||
                        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                      }
                      alt="You"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this anime..."
                      className="w-full bg-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      rows="4"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition flex items-center gap-2"
                        disabled={!newComment.trim()}
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 text-center py-4 bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => navigate("/login")}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Login to join the discussion
                </button>
              </div>
            )}

            {loadingComments ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 bg-gray-700/20 rounded-lg">
                <p className="text-gray-400">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    className="comment-container group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Main Comment */}
                    <div className="flex gap-4">
                      <div
                        className="relative cursor-pointer flex-shrink-0"
                        onClick={() => handleProfileClick(comment.userId)}
                      >
                        <img
                          src={
                            comment.userPhoto ||
                            "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                          }
                          alt={comment.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <motion.div
                          className="bg-gray-700 rounded-lg p-4 relative group-hover:bg-gray-600/50 transition"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-bold text-red-400 cursor-pointer hover:underline"
                                onClick={() =>
                                  handleProfileClick(comment.userId)
                                }
                              >
                                {comment.username}
                              </span>
                              <span className="text-xs text-gray-400">
                                {comment.timestamp?.toLocaleString() ||
                                  "Just now"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  onClick={() =>
                                    handleCommentReaction(comment.id, "like")
                                  }
                                  className={`flex items-center gap-1 ${
                                    comment.likes?.includes(user?.uid)
                                      ? "text-blue-500"
                                      : "text-gray-400"
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {comment.likes?.includes(user?.uid) ? (
                                    <AiFillLike className="text-lg" />
                                  ) : (
                                    <AiOutlineLike className="text-lg" />
                                  )}
                                  <span className="text-sm">
                                    {comment.likeCount || 0}
                                  </span>
                                </motion.button>
                                <motion.button
                                  onClick={() =>
                                    handleCommentReaction(comment.id, "dislike")
                                  }
                                  className={`flex items-center gap-1 ${
                                    comment.dislikes?.includes(user?.uid)
                                      ? "text-red-500"
                                      : "text-gray-400"
                                  }`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {comment.dislikes?.includes(user?.uid) ? (
                                    <AiFillDislike className="text-lg" />
                                  ) : (
                                    <AiOutlineDislike className="text-lg" />
                                  )}
                                  <span className="text-sm">
                                    {comment.dislikeCount || 0}
                                  </span>
                                </motion.button>
                              </div>
                              <button
                                onClick={() => {
                                  setReplyingTo(
                                    replyingTo === comment.id
                                      ? null
                                      : comment.id
                                  );
                                  setActiveComment(
                                    activeComment === comment.id
                                      ? null
                                      : comment.id
                                  );
                                }}
                                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 text-sm"
                              >
                                <FaReply />
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-200">{comment.text}</p>
                        </motion.div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <motion.form
                            onSubmit={(e) => handleReplySubmit(e, comment.id)}
                            className="mt-4 ml-10"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={
                                  user.photoURL ||
                                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                                }
                                alt="You"
                                className="w-8 h-8 rounded-full flex-shrink-0"
                              />
                              <div className="flex-grow">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) =>
                                    setReplyContent(e.target.value)
                                  }
                                  placeholder={`Replying to ${comment.username}...`}
                                  className="w-full bg-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-none"
                                  rows="2"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setActiveComment(null);
                                    }}
                                    className="text-gray-400 hover:text-white px-3 py-1 rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
                                    disabled={!replyContent.trim()}
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.form>
                        )}

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <motion.div
                            className="mt-4 ml-10 space-y-4 border-l-2 border-gray-700 pl-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {comment.replies.map((reply) => (
                              <motion.div
                                key={reply.id}
                                className="flex gap-3"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div
                                  className="relative cursor-pointer flex-shrink-0"
                                  onClick={() =>
                                    handleProfileClick(reply.userId)
                                  }
                                >
                                  <img
                                    src={
                                      reply.userPhoto ||
                                      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                                    }
                                    alt={reply.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                </div>
                                <div className="flex-grow">
                                  <motion.div
                                    className="bg-gray-700 rounded-lg p-3 group-hover:bg-gray-600/50 transition"
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="font-bold text-sm text-red-400 cursor-pointer hover:underline"
                                          onClick={() =>
                                            handleProfileClick(reply.userId)
                                          }
                                        >
                                          {reply.username}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {reply.timestamp?.toLocaleString() ||
                                            "Just now"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <motion.button
                                          onClick={() =>
                                            handleCommentReaction(
                                              reply.id,
                                              "like"
                                            )
                                          }
                                          className={`flex items-center gap-1 ${
                                            reply.likes?.includes(user?.uid)
                                              ? "text-blue-500"
                                              : "text-gray-400"
                                          }`}
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          {reply.likes?.includes(user?.uid) ? (
                                            <AiFillLike className="text-sm" />
                                          ) : (
                                            <AiOutlineLike className="text-sm" />
                                          )}
                                          <span className="text-xs">
                                            {reply.likeCount || 0}
                                          </span>
                                        </motion.button>
                                        <motion.button
                                          onClick={() =>
                                            handleCommentReaction(
                                              reply.id,
                                              "dislike"
                                            )
                                          }
                                          className={`flex items-center gap-1 ${
                                            reply.dislikes?.includes(user?.uid)
                                              ? "text-red-500"
                                              : "text-gray-400"
                                          }`}
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          {reply.dislikes?.includes(
                                            user?.uid
                                          ) ? (
                                            <AiFillDislike className="text-sm" />
                                          ) : (
                                            <AiOutlineDislike className="text-sm" />
                                          )}
                                          <span className="text-xs">
                                            {reply.dislikeCount || 0}
                                          </span>
                                        </motion.button>
                                      </div>
                                    </div>
                                    <p className="text-gray-200 text-sm">
                                      {reply.text}
                                    </p>
                                  </motion.div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailer && youtubeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          >
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(8px)" }}
              exit={{ backdropFilter: "blur(0px)" }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setShowTrailer(false)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-4xl"
            >
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute -top-12 right-0 text-white hover:text-red-500 transition"
                aria-label="Close trailer"
              >
                <AiOutlineClose size={30} />
              </button>

              <div className="aspect-w-16 aspect-h-9 bg-black rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  className="w-full h-[500px]"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${anime.title} Trailer`}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
