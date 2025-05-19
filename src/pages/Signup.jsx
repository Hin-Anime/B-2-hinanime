import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const navigate = useNavigate();

  // Validate username format
  const validateUsername = (username) => {
    return (
      /^[a-zA-Z0-9_]{3,20}$/.test(username) &&
      !/^(admin|owner|mod|support|system)$/i.test(username)
    );
  };

  // Check username availability (debounced)
  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      if (!validateUsername(username)) {
        setUsernameAvailable(false);
        setError(
          "Invalid username (3-20 alphanumeric chars, no reserved words)"
        );
        return;
      }

      setIsCheckingUsername(true);
      try {
        const usernameDoc = await getDoc(
          doc(db, "usernames", username.toLowerCase())
        );
        setUsernameAvailable(!usernameDoc.exists());
        setError("");
      } catch (err) {
        console.error("Username check error:", err);
        setUsernameAvailable(false);
        setError("Error checking username availability");
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Final validation
    if (!validateUsername(username)) {
      setError("Invalid username format");
      return;
    }

    if (usernameAvailable === false) {
      setError("Username is already taken");
      return;
    }

    try {
      // 1. Create auth account
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Reserve username (atomic operation)
      await setDoc(doc(db, "usernames", username.toLowerCase()), {
        userId: userCred.user.uid,
        createdAt: new Date(),
      });

      // 3. Upload profile picture if exists
      let photoURL = "";
      if (profilePic) {
        const storageRef = ref(storage, `profilePics/${userCred.user.uid}`);
        await uploadBytes(storageRef, profilePic);
        photoURL = await getDownloadURL(storageRef);
      }

      // 4. Create user document
      await setDoc(doc(db, "users", userCred.user.uid), {
        email: email,
        wishlist: [],
        profile: {
          username: username,
          photoURL: photoURL,
          bio: "",
          createdAt: new Date(),
        },
      });

      navigate("/");
    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "permission-denied") {
        setError("Username was taken just now. Please try another.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be 6+ characters");
      } else {
        setError("Signup failed. Please try again.");
      }
    }
  };

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0] || null);
  };

  return (
    <div className="signup-container">
      <h2>Create Account</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSignup}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (6+ characters)"
          required
          minLength={6}
        />

        <div className="username-field">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (3-20 chars)"
            required
            minLength={3}
            maxLength={20}
          />
          {isCheckingUsername && <span>Checking...</span>}
          {usernameAvailable && <span className="available">✓ Available</span>}
          {usernameAvailable === false && (
            <span className="taken">✗ Taken</span>
          )}
        </div>

        <div className="file-upload">
          <label>Profile Picture (optional)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <button
          type="submit"
          disabled={isCheckingUsername || usernameAvailable === false}
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;
