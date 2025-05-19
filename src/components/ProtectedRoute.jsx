import { Navigate } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
import { useAuth } from "../context/AuthContext"; // Adjust the import path as necessary
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default ProtectedRoute;
