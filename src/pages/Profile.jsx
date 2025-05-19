import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import "../styles/Profile.css";
import { motion } from "framer-motion";
import { FiEdit2, FiSave, FiX, FiUpload } from "react-icons/fi";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: "", bio: "" });
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [previewImage, setPreviewImage] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const RESERVED_USERNAMES = [
    // Administrative terms
    "admin",
    "administrator",
    "owner",
    "mod",
    "moderator",
    "system",
    "support",
    "root",
    "staff",
    "official",
    "help",
    "contact",
    "server",
    "null",
    "undefined",

    // Sexual/explicit content
    "sex",
    "sexy",
    "sexytime",
    "sexybabe",
    "sexygirl",
    "sexyboy",
    "sexybitch",
    "xxx",
    "porn",
    "porno",
    "nude",
    "nudes",
    "onlyfans",
    "fansly",
    "nsfw",
    "hentai",
    "cum",
    "cums",
    "cumshot",
    "dick",
    "cock",
    "penis",
    "pussy",
    "vagina",
    "boobs",
    "tits",
    "ass",
    "anal",
    "blowjob",
    "handjob",
    "bj",
    "hj",
    "masterbate",

    // Offensive language
    "fuck",
    "fuckyou",
    "fuckyourself",
    "fucking",
    "fucker",
    "fucked",
    "fucks",
    "shit",
    "shitter",
    "bullshit",
    "bitch",
    "bitches",
    "whore",
    "slut",
    "cunt",
    "asshole",
    "dickhead",
    "motherfucker",
    "mf",
    "mfer",
    "damn",
    "godamn",
    "hell",

    // Racial slurs and offensive terms
    "nigger",
    "nigga",
    "n1gg3r",
    "n1gger",
    "nigg3r",
    "n1gga",
    "niggah",
    "kike",
    "spic",
    "wetback",
    "chink",
    "gook",
    "raghead",
    "towelhead",
    "sandnigger",
    "beaner",
    "coon",
    "darkie",
    "halfbreed",
    "redskin",
    "slanteye",
    "whitey",

    // LGBTQ+ slurs
    "fag",
    "faggot",
    "fagot",
    "dyke",
    "queer",
    "homo",
    "tranny",
    "shemale",
    "lesbo",
    "poof",
    "twink",
    "bear",
    "butch",
    "femme",

    // Violence/harm
    "kill",
    "killer",
    "killing",
    "murder",
    "rape",
    "rapist",
    "suicide",
    "hang",
    "shoot",
    "shooter",
    "stab",
    "cut",
    "cutter",
    "terrorist",
    "isis",
    "alqaeda",
    "nazi",
    "kkk",
    "hitler",
    "schoolshooter",
    "bomb",
    "terror",
    "jihad",

    // Drugs/alcohol
    "weed",
    "cocaine",
    "coke",
    "heroin",
    "meth",
    "methhead",
    "crack",
    "ecstasy",
    "mdma",
    "lsd",
    "acid",
    "shrooms",
    "mushrooms",
    "ketamine",
    "opium",
    "xanax",
    "valium",
    "oxy",
    "perc",
    "fentanyl",
    "alcohol",
    "beer",
    "whiskey",
    "vodka",
    "rum",
    "tequila",
    "gin",
    "brandy",
    "moonshine",
    "dope",
    "joint",
    "blunt",

    // Bypass attempts (common variations)
    "f_u_c_k",
    "f.uck",
    "f-uck",
    "f*ck",
    "fck",
    "fuk",
    "phuck",
    "phuk",
    "fvck",
    "sh1t",
    "sh!t",
    "sht",
    "$hit",
    "b!tch",
    "b1tch",
    "biatch",
    "beotch",
    "b1tch",
    "n1gg",
    "n!gg",
    "n*gg",
    "nigg",
    "n1g",
    "n!g",
    "n*g",
    "n1g3r",
    "n!g3r",
    "n*g3r",

    // Self-harm/suicide
    "cutting",
    "selfharm",
    "selfharmm",
    "suicidal",
    "killmyself",
    "enditall",
    "depressed",
    "depression",
    "anxiety",
    "mentalillness",
    "mentalhealth",

    // Illegal activities
    "hacker",
    "hacking",
    "cracker",
    "cracking",
    "pirate",
    "piracy",
    "warez",
    "cracks",
    "keygen",
    "serial",
    "torrent",
    "illegal",
    "stolen",
    "fraud",
    "scammer",
    "scamming",
    "phishing",
    "spammer",
    "spamming",
    "cheat",
    "cheater",
    "hacks",
    "aimbot",
    "wallhack",
    "exploit",
    "ddos",
    "botnet",
    "virus",
    "malware",

    // Other offensive terms
    "retard",
    "retarded",
    "spastic",
    "mong",
    "downsyndrome",
    "autistic",
    "aspergers",
    "cripple",
    "gimp",
    "midget",
    "dwarf",
    "fatso",
    "lardass",
    "ugly",
    "stupid",
    "idiot",
    "moron",
    "imbecile",
    "dumbass",
    "dummy",
    "freak",
    "weirdo",
    "loser",

    // Common bypass patterns
    "1337",
    "420",
    "666",
    "69",
    "xxx",
    "xyz",
    "abc",
    "qwerty",
    "asdf",
    "password",
    "admin123",
    "root123",
    "test",
    "demo",
    "guest",
    "user",
    "anonymous",

    // Empty/space variants
    " ",
    "  ",
    "   ",
    "-",
    "--",
    "---",
    "...",
    "..",
    ".",
    "_",
    "__",
    "___",
  ];
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setProfile(userData.profile || {});
          setFormData({
            username: userData.profile?.username || user.email.split("@")[0],
            bio: userData.profile?.bio || "",
          });
          if (userData.profile?.photoURL)
            setPreviewImage(userData.profile.photoURL);
          if (userData.profile?.bannerURL)
            setBannerPreview(userData.profile.bannerURL);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  function isCleanUsername(username) {
    return !username.matches("(?i)(badword1|badword2)");
  }

  const validateUsernameFormat = (username) => {
    if (username.length < 3) return "Too short (min 3 chars)";
    if (username.length > 15) return "Too long (max 15 chars)"; // New check
    if (!/^[a-z0-9_]+$/i.test(username)) return "Only letters, numbers, _";
    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      return "Reserved username";
    }
    return null;
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) return false;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("profile.username", "==", username));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.username && formData.username !== profile.username) {
        const formatError = validateUsernameFormat(formData.username);
        if (formatError) {
          setUsernameError(formatError);
          setUsernameAvailable(false);
          return;
        }

        setCheckingUsername(true);
        try {
          const available = await checkUsernameAvailability(formData.username);
          setUsernameAvailable(available);
          setUsernameError(available ? null : "Username already taken");
        } catch (error) {
          setUsernameError("Error checking username");
        } finally {
          setCheckingUsername(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, profile.username]);

  // In your Profile component, add this useEffect
  React.useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setProfile(userData.profile || {});
        setFormData({
          username: userData.profile?.username || user.email.split("@")[0],
          bio: userData.profile?.bio || "",
        });
        if (userData.profile?.photoURL)
          setPreviewImage(userData.profile.photoURL);
        if (userData.profile?.bannerURL)
          setBannerPreview(userData.profile.bannerURL);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        !["image/png", "image/jpeg", "image/jpg", "image/gif"].includes(
          file.type
        )
      ) {
        setMessage("❌ Only PNG, JPG, or GIF images are allowed");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setPreviewImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        !["image/png", "image/jpeg", "image/jpg", "image/gif"].includes(
          file.type
        )
      ) {
        setMessage("❌ Only PNG, JPG, or GIF images are allowed");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setBannerPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const sigRes = await fetch("http://localhost:5000/api/signature", {
      method: "POST",
    });
    const sigData = await sigRes.json();
    const {
      signature,
      timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      upload_preset: uploadPreset,
    } = sigData;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("api_key", apiKey);
    uploadFormData.append("timestamp", timestamp);
    uploadFormData.append("signature", signature);
    uploadFormData.append("upload_preset", uploadPreset);
    uploadFormData.append("overwrite", "true");

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadFormData }
    );
    const uploadData = await uploadRes.json();

    if (uploadData.secure_url) {
      return uploadData.secure_url;
    } else {
      throw new Error("Image upload failed.");
    }
  };

  // In your Profile component, modify the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formatError = validateUsernameFormat(formData.username);
    if (formatError) {
      setUsernameError(formatError);
      return;
    }

    if (!usernameAvailable && formData.username !== profile.username) {
      setUsernameError("Please choose an available username");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const userRef = doc(db, "users", user.uid);
      let photoURL = profile.photoURL || "";
      let bannerURL = profile.bannerURL || "";

      if (fileInputRef.current?.files[0]) {
        photoURL = await uploadImageToCloudinary(fileInputRef.current.files[0]);
      }

      if (bannerInputRef.current?.files[0]) {
        bannerURL = await uploadImageToCloudinary(
          bannerInputRef.current.files[0]
        );
      }

      const updatedProfile = {
        ...profile,
        username: formData.username,
        bio: formData.bio,
        photoURL,
        bannerURL,
        updatedAt: new Date(),
        createdAt: profile.createdAt || new Date(),
      };

      await updateDoc(userRef, {
        profile: updatedProfile,
      });

      // Update local state immediately
      setProfile(updatedProfile);
      setEditMode(false);
      setMessage("✅ Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("❌ Failed to update profile.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {editMode ? (
          <motion.form
            onSubmit={handleSubmit}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-indigo-500/20"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Banner */}
            <div className="relative h-40 w-full bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden">
              {bannerPreview ? (
                <motion.img
                  src={bannerPreview}
                  alt="Banner Preview"
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <span>Banner Preview</span>
                </div>
              )}
              <div className="absolute bottom-4 right-4">
                <label className="cursor-pointer bg-indigo-600/80 hover:bg-indigo-700/90 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 backdrop-blur-sm flex items-center justify-center w-10 h-10">
                  <FiUpload className="h-5 w-5" />
                  <input
                    type="file"
                    onChange={handleBannerImageChange}
                    ref={bannerInputRef}
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.gif"
                  />
                </label>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {previewImage ? (
                    <motion.img
                      src={previewImage}
                      alt="Profile Preview"
                      className="h-24 w-24 rounded-full border-4 border-indigo-500 object-cover shadow-lg"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full border-4 border-indigo-500 bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400">Photo</span>
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110">
                    <FiUpload className="h-5 w-5" />
                    <input
                      type="file"
                      onChange={handleProfileImageChange}
                      ref={fileInputRef}
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.gif"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">
                    Upload PNG, JPG, or GIF
                  </p>
                  <p className="text-xs text-gray-400">Max 5MB</p>
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Username
                </label>
                <motion.div whileHover={{ scale: 1.01 }}>
                  <input
                    value={formData.username}
                    onChange={(e) => {
                      if (e.target.value.length <= 15) {
                        setFormData({ ...formData, username: e.target.value });
                        setUsernameError("");
                      }
                    }}
                    maxLength={15}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white
                      transition-all duration-300"
                  />
                </motion.div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-gray-400">
                    {formData.username.length}/15 characters
                  </span>
                  {checkingUsername && (
                    <motion.span
                      className="text-xs text-yellow-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Checking...
                    </motion.span>
                  )}
                </div>
                {usernameError && (
                  <motion.p
                    className="text-xs text-red-400 mt-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {usernameError}
                  </motion.p>
                )}
                {usernameAvailable && (
                  <motion.p
                    className="text-xs text-green-400 mt-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    ✓ Username available!
                  </motion.p>
                )}
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Bio
                </label>
                <motion.div whileHover={{ scale: 1.01 }}>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white min-h-[120px]
                      transition-all duration-300"
                  />
                </motion.div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-2">
                <motion.button
                  type="submit"
                  disabled={
                    uploading ||
                    usernameError ||
                    (formData.username !== profile.username &&
                      !usernameAvailable)
                  }
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg 
                    hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="h-5 w-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg 
                    hover:bg-gray-600 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiX className="h-5 w-5" />
                  <span>Cancel</span>
                </motion.button>
              </div>

              {message && (
                <motion.div
                  className={`mt-3 p-3 rounded-lg ${
                    message.includes("✅")
                      ? "bg-green-900/30 text-green-300"
                      : "bg-red-900/30 text-red-300"
                  } border ${
                    message.includes("✅")
                      ? "border-green-500/30"
                      : "border-red-500/30"
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {message}
                </motion.div>
              )}
            </div>
          </motion.form>
        ) : (
          <motion.div
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-indigo-500/20"
            whileHover={{ scale: 1.005 }}
          >
            {/* Banner */}
            <div className="relative h-48 w-full bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden">
              {profile.bannerURL ? (
                <motion.img
                  src={profile.bannerURL}
                  alt="Banner"
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <span>No banner yet</span>
                </div>
              )}
            </div>

            {/* Profile Content */}
            <div className="p-6 text-center relative">
              <div className="flex justify-center -mt-16">
                <motion.div className="relative" whileHover={{ scale: 1.05 }}>
                  <img
                    src={
                      profile.photoURL ||
                      "https://cdn.vectorstock.com/i/2000v/97/68/account-avatar-dark-mode-glyph-ui-icon-vector-44429768.avif"
                    }
                    alt="Profile"
                    className="h-32 w-32 rounded-full border-4 border-indigo-500 object-cover shadow-lg"
                  />
                </motion.div>
              </div>

              <motion.h2
                className="mt-4 text-2xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {profile.username || user?.email?.split("@")[0]}
              </motion.h2>

              <motion.p
                className="mt-2 text-gray-400 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {profile.bio || "No bio yet"}
              </motion.p>

              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg 
                    hover:bg-indigo-700 flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiEdit2 className="h-5 w-5" />
                  <span>Edit Profile</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
