import { Navigate } from "react-router-dom";

// Keep a simple guard if needed; currently unused by routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;

