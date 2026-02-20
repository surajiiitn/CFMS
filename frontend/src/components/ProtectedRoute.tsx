import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppLoader } from "@/components/layout/AppLoader";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoader title="Restoring session" subtitle="Verifying your account access" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoader title="Preparing auth" subtitle="Loading sign-in screen" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
