import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import DoctorProfiles from "@/components/DoctorProfiles";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { AuthForm } from "@/components/AuthForm";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for admin session first
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (isAdmin) {
      localStorage.removeItem('adminSession');
      setIsAdmin(false);
      window.location.reload();
    } else {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show admin dashboard if admin is logged in
  if (isAdmin) {
    return <AdminDashboard onSignOut={handleSignOut} />;
  }

  // Show auth form if user is not logged in
  if (!user) {
    return <AuthForm />;
  }

  // Show main app for logged in users
  return (
    <div className="min-h-screen">
      <Header user={user} onSignOut={handleSignOut} />
      <main>
        <Hero />
        <Services />
        <DoctorProfiles />
        <AppointmentBooking user={user} />
      </main>
    </div>
  );
};

export default Index;