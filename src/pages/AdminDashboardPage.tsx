import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/AdminDashboard";

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const adminSession = localStorage.getItem("adminSession");
    if (!adminSession) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("adminSession");
    navigate("/", { replace: true });
  };

  return <AdminDashboard onSignOut={handleSignOut} />;
};

export default AdminDashboardPage;
