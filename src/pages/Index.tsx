import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import DoctorProfiles from "@/components/DoctorProfiles";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Services />
      <DoctorProfiles />
    </div>
  );
};

export default Index;