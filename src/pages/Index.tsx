import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import DoctorProfiles from "@/components/DoctorProfiles";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { Chatbot } from "@/components/Chatbot";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Services />
      <DoctorProfiles />
      <AppointmentBooking />
      <Chatbot />
    </div>
  );
};

export default Index;