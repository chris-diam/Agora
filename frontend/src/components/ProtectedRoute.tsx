import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
