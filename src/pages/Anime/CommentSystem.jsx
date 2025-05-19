import React, { useState, useEffect } from "react";
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
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const CommentSystem = ({ episodeId, animeTitle = "Anime Episode" }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  const episodeRef = doc(db, "episodes", episodeId);

  useEffect(() => {
    const unsubscribe = onSnapshot(episodeRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Sort comments by timestamp (newest first)
        const sortedComments = (data.comments || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setComments(sortedComments);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [episodeId]);

  const fetchUserDetails = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUserDetails(userDoc.data());
        setShowUserModal(true);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user || !newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const comment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.uid,
        username: userData?.profile?.username || "Anonymous",
        profilePic: userData?.profile?.photoURL || null,
        text: newComment,
        timestamp: new Date().toISOString(),
        replies: [],
        likes: [],
        dislikes: [],
      };

      await updateDoc(episodeRef, {
        comments: arrayUnion(comment),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentComment) => {
    if (!user || !replyContent.trim()) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const reply = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.uid,
        username: userData?.profile?.username || "Anonymous",
        profilePic: userData?.profile?.photoURL || null,
        text: replyContent,
        timestamp: new Date().toISOString(),
        replyingTo: parentComment.username,
        likes: [],
        dislikes: [],
      };

      const updatedComments = comments.map((comment) => {
        if (comment.id === parentComment.id) {
          return { ...comment, replies: [...(comment.replies || []), reply] };
        }
        return comment;
      });

      await updateDoc(episodeRef, { comments: updatedComments });
      setReplyContent("");
      setActiveReplyId(null);
    } catch (error) {
      console.error("Error submitting reply:", error);
    }
  };

  const handleReaction = async (commentId, type, isReply = false) => {
    if (!user) return;

    try {
      const updatedComments = comments.map((comment) => {
        if (isReply && comment.replies) {
          const updatedReplies = comment.replies.map((reply) => {
            if (reply.id === commentId) {
              return updateReaction(reply, type);
            }
            return reply;
          });
          return { ...comment, replies: updatedReplies };
        }

        if (comment.id === commentId) {
          return updateReaction(comment, type);
        }
        return comment;
      });

      await updateDoc(episodeRef, { comments: updatedComments });
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const updateReaction = (item, type) => {
    const opposite = type === "likes" ? "dislikes" : "likes";
    const currentLikes = item.likes || [];
    const currentDislikes = item.dislikes || [];

    const updatedItem = { ...item };

    if (type === "likes") {
      updatedItem.likes = currentLikes.includes(user.uid)
        ? currentLikes.filter((id) => id !== user.uid)
        : [...currentLikes, user.uid];
      updatedItem.dislikes = currentDislikes.filter((id) => id !== user.uid);
    } else {
      updatedItem.dislikes = currentDislikes.includes(user.uid)
        ? currentDislikes.filter((id) => id !== user.uid)
        : [...currentDislikes, user.uid];
      updatedItem.likes = currentLikes.filter((id) => id !== user.uid);
    }

    return updatedItem;
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {animeTitle} Discussion
        </h2>
      </div>

      {/* Comment Input */}
      {user ? (
        <div className="mb-6 flex items-start space-x-3">
          <Avatar
            src={user.photoURL}
            onClick={() => fetchUserDetails(user.uid)}
            className="flex-shrink-0"
          />
          <div className="flex-1">
            <textarea
              className="w-full px-4 py-2 text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Share your thoughts..."
              rows="3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleCommentSubmit()
              }
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleCommentSubmit}
                disabled={isSubmitting || !newComment.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            <FaSignInAlt className="mr-2" />
            Sign in to comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Community Discussion ({comments.length})
        </h3>

        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              onReply={(id) =>
                setActiveReplyId(id === activeReplyId ? null : id)
              }
              onReaction={handleReaction}
              onDelete={handleDeleteComment}
              activeReplyId={activeReplyId}
              replyContent={replyContent}
              onReplyChange={setReplyContent}
              onReplySubmit={() => handleReplySubmit(comment)}
              fetchUserDetails={fetchUserDetails}
            />
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {user ? "Be the first to comment!" : "Sign in to comment"}
          </p>
        )}
      </div>

      {/* User Profile Modal */}
      {showUserModal && userDetails && (
        <UserProfileModal
          userDetails={userDetails}
          currentUser={user}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  );
};

// Sub-components

const Avatar = ({ src, onClick, className = "" }) => {
  return (
    <div
      onClick={onClick}
      className={`w-10 h-10 rounded-full overflow-hidden cursor-pointer ${className}`}
    >
      {src ? (
        <img src={src} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <FaUserCircle className="w-full h-full text-gray-400" />
      )}
    </div>
  );
};

const CommentItem = ({
  comment,
  user,
  onReply,
  onReaction,
  onDelete,
  activeReplyId,
  replyContent,
  onReplyChange,
  onReplySubmit,
  fetchUserDetails,
}) => {
  const isOwnComment = user?.uid === comment.userId;
  const hasLiked = user && (comment.likes || []).includes(user.uid);
  const hasDisliked = user && (comment.dislikes || []).includes(user.uid);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      {/* Comment Header */}
      <div className="flex items-start space-x-3">
        <Avatar
          src={comment.profilePic}
          onClick={() => fetchUserDetails(comment.userId)}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.username}
              </span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeTime(comment.timestamp)}
              </span>
            </div>
            {isOwnComment && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-gray-400 hover:text-red-500"
                title="Delete comment"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>

          {/* Comment Text */}
          <p className="mt-1 text-gray-700 dark:text-gray-300">
            {comment.text}
          </p>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-3">
            <button
              onClick={() => onReaction(comment.id, "likes")}
              disabled={!user}
              className={`flex items-center space-x-1 text-sm ${
                hasLiked
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-500 dark:text-gray-400"
              } ${
                !user
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:text-purple-600 dark:hover:text-purple-400"
              }`}
            >
              <FaThumbsUp />
              <span>{(comment.likes || []).length}</span>
            </button>

            <button
              onClick={() => onReaction(comment.id, "dislikes")}
              disabled={!user}
              className={`flex items-center space-x-1 text-sm ${
                hasDisliked
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400"
              } ${
                !user ? "opacity-50 cursor-not-allowed" : "hover:text-red-500"
              }`}
            >
              <FaThumbsDown />
              <span>{(comment.dislikes || []).length}</span>
            </button>

            {user && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <FaReply />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {activeReplyId === comment.id && user && (
            <div className="mt-3 flex items-start space-x-3">
              <Avatar src={user.photoURL} className="flex-shrink-0" />
              <div className="flex-1">
                <textarea
                  className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  placeholder={`Reply to ${comment.username}...`}
                  rows="2"
                  value={replyContent}
                  onChange={(e) => onReplyChange(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && onReplySubmit()
                  }
                />
                <div className="flex justify-end mt-1">
                  <button
                    onClick={onReplySubmit}
                    disabled={!replyContent.trim()}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded disabled:opacity-50 flex items-center"
                  >
                    <FaPaperPlane className="mr-1" size={12} />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="mt-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
              {comment.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                >
                  <div className="flex items-start space-x-2">
                    <Avatar
                      src={reply.profilePic}
                      onClick={() => fetchUserDetails(reply.userId)}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {reply.username}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(reply.timestamp)}
                          </span>
                          {reply.replyingTo && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              @{reply.replyingTo}
                            </span>
                          )}
                        </div>
                        {user?.uid === reply.userId && (
                          <button
                            onClick={() => onDelete(reply.id, true, comment.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete reply"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {reply.text}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <button
                          onClick={() => onReaction(reply.id, "likes", true)}
                          disabled={!user}
                          className={`flex items-center space-x-1 text-xs ${
                            (reply.likes || []).includes(user?.uid)
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-gray-500 dark:text-gray-400"
                          } ${
                            !user
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:text-purple-600 dark:hover:text-purple-400"
                          }`}
                        >
                          <FaThumbsUp size={10} />
                          <span>{(reply.likes || []).length}</span>
                        </button>
                        <button
                          onClick={() => onReaction(reply.id, "dislikes", true)}
                          disabled={!user}
                          className={`flex items-center space-x-1 text-xs ${
                            (reply.dislikes || []).includes(user?.uid)
                              ? "text-red-500"
                              : "text-gray-500 dark:text-gray-400"
                          } ${
                            !user
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:text-red-500"
                          }`}
                        >
                          <FaThumbsDown size={10} />
                          <span>{(reply.dislikes || []).length}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserProfileModal = ({ userDetails, currentUser, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Banner */}
        <div
          className="h-32 bg-cover bg-center rounded-t-lg"
          style={{
            backgroundImage: `url(${
              userDetails.profile?.bannerURL ||
              "https://via.placeholder.com/800x200"
            })`,
          }}
        ></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white dark:bg-gray-700 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <FaTimes className="text-gray-700 dark:text-gray-300" />
        </button>

        {/* Profile Content */}
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="relative">
              {userDetails.profile?.photoURL ? (
                <img
                  src={userDetails.profile.photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800"
                />
              ) : (
                <FaUserCircle className="w-24 h-24 text-gray-400 rounded-full border-4 border-white dark:border-gray-800" />
              )}
            </div>
          </div>

          {/* Username */}
          <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {userDetails.profile?.username || "Anonymous"}
          </h3>

          {/* User Details */}
          <div className="space-y-3 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email
              </h4>
              <p className="text-gray-900 dark:text-white">
                {userDetails.email || "Not provided"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Joined
              </h4>
              <p className="text-gray-900 dark:text-white">
                {userDetails.createdAt?.seconds
                  ? new Date(
                      userDetails.createdAt.seconds * 1000
                    ).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Bio
              </h4>
              <p className="text-gray-900 dark:text-white">
                {userDetails.profile?.bio || "No bio yet"}
              </p>
            </div>
          </div>

          {/* Delete Comments Button (only shows if viewing own profile) */}
          {currentUser?.uid === userDetails.uid && (
            <div className="mt-6">
              <button
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                onClick={() => {
                  // Implement delete all comments functionality
                  alert("Delete all comments functionality would go here");
                }}
              >
                Delete My Comments
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function for relative time
const formatRelativeTime = (timestamp) => {
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

export default CommentSystem;
