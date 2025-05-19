import React, { useEffect, useState } from "react";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaReply,
  FaPaperPlane,
  FaUserCircle,
  FaTimes,
  FaTrash,
  FaSignInAlt,
  FaSpinner,
} from "react-icons/fa";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import "./Message.css";

// Helper function for relative time (e.g., "1 hour ago")
const getRelativeTime = (timestamp) => {
  const now = new Date();
  const commentDate = new Date(timestamp);
  const seconds = Math.floor((now - commentDate) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
  }

  return "Just now";
};

const Message = () => {
  const { user } = useAuth();
  const [likes, setLikes] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const episodeRef = doc(db, "episodes", "Naruto");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(episodeRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLikes(data.reactions?.likes || []);
        setDislikes(data.reactions?.dislikes || []);

        // Sort comments by timestamp (newest first)
        const sortedComments = (data.comments || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setComments(sortedComments);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserDetails = async (userId) => {
    if (!userId) {
      setProfileError("No user ID provided");
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError(null);
      const userDoc = await getDoc(doc(db, "users", userId));

      if (userDoc.exists()) {
        setUserDetails(userDoc.data());
        setShowUserModal(true);
      } else {
        setProfileError("User profile not found");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setProfileError("Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleReaction = async (type) => {
    if (!user) return;

    const opposite = type === "likes" ? "dislikes" : "likes";
    const currentReactions = type === "likes" ? likes : dislikes;

    try {
      await updateDoc(episodeRef, {
        [`reactions.${type}`]: currentReactions.includes(user.uid)
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid),
        [`reactions.${opposite}`]: arrayRemove(user.uid),
      });
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const handleCommentReaction = async (commentId, type, isReply = false) => {
    if (!user) return;

    try {
      const updatedComments = comments.map((comment) => {
        if (isReply && comment.replies) {
          const updatedReplies = comment.replies.map((reply) => {
            if (reply.id === commentId) {
              const opposite = type === "likes" ? "dislikes" : "likes";
              const currentLikes = reply.likes || [];
              const currentDislikes = reply.dislikes || [];

              const updatedReply = { ...reply };

              if (type === "likes") {
                updatedReply.likes = currentLikes.includes(user.uid)
                  ? currentLikes.filter((id) => id !== user.uid)
                  : [...currentLikes, user.uid];
                updatedReply.dislikes = currentDislikes.filter(
                  (id) => id !== user.uid
                );
              } else {
                updatedReply.dislikes = currentDislikes.includes(user.uid)
                  ? currentDislikes.filter((id) => id !== user.uid)
                  : [...currentDislikes, user.uid];
                updatedReply.likes = currentLikes.filter(
                  (id) => id !== user.uid
                );
              }

              return updatedReply;
            }
            return reply;
          });
          return { ...comment, replies: updatedReplies };
        }

        if (comment.id === commentId) {
          const opposite = type === "likes" ? "dislikes" : "likes";
          const currentLikes = comment.likes || [];
          const currentDislikes = comment.dislikes || [];

          const updatedComment = { ...comment };

          if (type === "likes") {
            updatedComment.likes = currentLikes.includes(user.uid)
              ? currentLikes.filter((id) => id !== user.uid)
              : [...currentLikes, user.uid];
            updatedComment.dislikes = currentDislikes.filter(
              (id) => id !== user.uid
            );
          } else {
            updatedComment.dislikes = currentDislikes.includes(user.uid)
              ? currentDislikes.filter((id) => id !== user.uid)
              : [...currentDislikes, user.uid];
            updatedComment.likes = currentLikes.filter((id) => id !== user.uid);
          }

          return updatedComment;
        }
        return comment;
      });

      await updateDoc(episodeRef, {
        comments: updatedComments,
      });
    } catch (error) {
      console.error("Error updating comment reaction:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user || !newComment.trim() || isSubmitting) return;

    const commentText = newComment;
    setNewComment(""); // Clear input immediately

    try {
      setIsSubmitting(true);
      const userDocRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDocRef);
      const userData = userSnapshot.data();
      const username = userData?.profile?.username || "Anonymous";
      const profilePic = userData?.profile?.photoURL || null;

      const comment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.uid,
        username,
        profilePic,
        text: commentText,
        timestamp: new Date().toISOString(),
        replies: [],
        likes: [],
        dislikes: [],
      };

      await updateDoc(episodeRef, {
        comments: arrayUnion(comment),
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  const handleReplySubmit = async (parentComment) => {
    if (!user || !replyContent.trim()) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDocRef);
      const userData = userSnapshot.data();
      const username = userData?.profile?.username || "Anonymous";
      const profilePic = userData?.profile?.photoURL || null;

      const reply = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.uid,
        username,
        profilePic,
        text: replyContent,
        timestamp: new Date().toISOString(),
        replyingTo: parentComment.username,
        likes: [],
        dislikes: [],
      };

      const updatedComments = comments.map((comment) => {
        if (comment.id === parentComment.id) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          };
        }
        return comment;
      });

      await updateDoc(episodeRef, {
        comments: updatedComments,
      });

      setReplyContent("");
      setActiveReplyId(null);
    } catch (error) {
      console.error("Error submitting reply:", error);
    }
  };

  const handleDeleteComment = async (
    commentId,
    isReply = false,
    parentId = null
  ) => {
    if (!user) return;

    try {
      if (isReply && parentId) {
        const updatedComments = comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.filter(
                (reply) => reply.id !== commentId
              ),
            };
          }
          return comment;
        });
        await updateDoc(episodeRef, { comments: updatedComments });
      } else {
        const updatedComments = comments.filter(
          (comment) => comment.id !== commentId
        );
        await updateDoc(episodeRef, { comments: updatedComments });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const renderComment = (comment, isReply = false, parentComment = null) => {
    const commentLikes = comment.likes || [];
    const commentDislikes = comment.dislikes || [];
    const hasLiked = user && commentLikes.includes(user.uid);
    const hasDisliked = user && commentDislikes.includes(user.uid);
    const isOwnComment = user && user.uid === comment.userId;

    return (
      <div
        key={comment.id}
        className={`comment-bubble ${isReply ? "reply-bubble" : ""}`}
      >
        <div className="comment-header">
          <div
            className="profile-pic-container"
            onClick={() => fetchUserDetails(comment.userId)}
            title="View profile"
          >
            {comment.profilePic ? (
              <img
                src={comment.profilePic}
                alt="Profile"
                className="profile-pic"
              />
            ) : (
              <FaUserCircle className="default-profile-pic" />
            )}
          </div>
          <div className="comment-user-info">
            <span className="comment-username">{comment.username}</span>
            <span className="comment-time">
              {getRelativeTime(comment.timestamp)}
            </span>
          </div>
          {isOwnComment && (
            <button
              className="delete-comment-btn"
              onClick={() =>
                handleDeleteComment(comment.id, isReply, parentComment?.id)
              }
              title="Delete comment"
            >
              <FaTrash />
            </button>
          )}
        </div>

        {comment.replyingTo && (
          <div className="replying-to">Replying to @{comment.replyingTo}</div>
        )}

        <p className="comment-text">{comment.text}</p>

        <div className="comment-actions">
          <button
            className={`like-btn ${hasLiked ? "active" : ""} ${
              !user ? "disabled" : ""
            }`}
            onClick={() => handleCommentReaction(comment.id, "likes", isReply)}
            disabled={!user}
            title={!user ? "Sign in to like" : ""}
          >
            <FaThumbsUp /> <span>{commentLikes.length}</span>
          </button>

          <button
            className={`dislike-btn ${hasDisliked ? "active" : ""} ${
              !user ? "disabled" : ""
            }`}
            onClick={() =>
              handleCommentReaction(comment.id, "dislikes", isReply)
            }
            disabled={!user}
            title={!user ? "Sign in to dislike" : ""}
          >
            <FaThumbsDown /> <span>{commentDislikes.length}</span>
          </button>

          {!isReply && user && (
            <button
              className="reply-buttonv3"
              onClick={() =>
                setActiveReplyId(
                  comment.id === activeReplyId ? null : comment.id
                )
              }
              title="Reply to this comment"
            >
              <FaReply /> Reply
            </button>
          )}
        </div>

        {activeReplyId === comment.id && user && (
          <div className="reply-input">
            <input
              type="text"
              placeholder={`Reply to ${comment.username}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && handleReplySubmit(comment)
              }
            />
            <button
              onClick={() => handleReplySubmit(comment)}
              className="send-reply-buttonv3"
              title="Send reply"
            >
              <FaPaperPlane />
            </button>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="replies-container">
            {comment.replies.map((reply) =>
              renderComment(reply, true, comment)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="naruto-container">
      <div className="episode-header">
        <h2>Naruto Episode Discussion</h2>
      </div>

      <div className="reaction-buttonsv3">
        <button
          onClick={() => (user ? handleReaction("likes") : null)}
          className={`like-btn ${likes.includes(user?.uid) ? "active" : ""} ${
            !user ? "disabled" : ""
          }`}
          disabled={!user}
          title={!user ? "Sign in to react" : ""}
        >
          <FaThumbsUp /> <span>{likes.length}</span>
        </button>

        <button
          onClick={() => (user ? handleReaction("dislikes") : null)}
          className={`dislike-btn ${
            dislikes.includes(user?.uid) ? "active" : ""
          } ${!user ? "disabled" : ""}`}
          disabled={!user}
          title={!user ? "Sign in to react" : ""}
        >
          <FaThumbsDown /> <span>{dislikes.length}</span>
        </button>
      </div>

      <div className="comments-sectionv3">
        <h3>Community Discussion ({comments.length})</h3>

        <div className="comments-listv3">
          {comments.length > 0 ? (
            comments.map((comment) => renderComment(comment))
          ) : (
            <p className="no-comments">
              {loading
                ? "Loading..."
                : user
                ? "Be the first to comment!"
                : "Sign in to comment"}
            </p>
          )}
        </div>

        {user ? (
          <div className="comment-input-area">
            <input
              type="text"
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
            />
            <button
              onClick={handleCommentSubmit}
              className="send-button"
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? (
                <FaSpinner className="spinner" />
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </div>
        ) : (
          <div className="login-prompt">
            <Link to="/login" className="login-button">
              <FaSignInAlt /> Sign in to comment
            </Link>
          </div>
        )}
      </div>

      {showUserModal && userDetails && (
        <div className="user-modal-overlay">
          <div className="user-modal">
            <div
              className="user-bannerv3"
              style={{
                backgroundImage: `url(${
                  userDetails.profile?.bannerURL ||
                  "https://wallpapercave.com/wp/wp7129436.jpg"
                })`,
              }}
            ></div>

            <button
              className="close-modal"
              onClick={() => setShowUserModal(false)}
            >
              <FaTimes />
            </button>

            <div className="user-modal-header">
              <div className="profile-pic-wrapperv3">
                {userDetails.profile?.photoURL ? (
                  <img
                    src={userDetails.profile.photoURL}
                    alt="Profile"
                    className="modal-profile-picv3"
                  />
                ) : (
                  <FaUserCircle className="modal-default-pic" />
                )}
              </div>
              <h3 className="modal-username">
                {userDetails.profile?.username || "Anonymous"}
              </h3>
            </div>

            <div className="user-detailsv3">
              <p>
                <strong>Email:</strong> {userDetails.email || "Not provided"}
              </p>
              <p>
                <strong>Joined:</strong>{" "}
                {userDetails.createdAt?.seconds
                  ? new Date(
                      userDetails.createdAt.seconds * 1000
                    ).toLocaleDateString()
                  : "Unknown"}
              </p>
              <p>
                <strong>Bio:</strong> {userDetails.profile?.bio || "No bio yet"}
              </p>
            </div>

            {user?.uid === userDetails.uid && (
              <button
                className="delete-comments-btn2"
                onClick={() => {
                  alert("Delete all comments functionality would go here");
                }}
              >
                Delete My Comments
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
