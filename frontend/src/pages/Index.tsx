import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppLoader } from "@/components/layout/AppLoader";

const Index = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoader title="Launching CFMS" subtitle="Connecting your workspace" />;
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

export default Index;
