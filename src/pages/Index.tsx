import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import DoctorProfiles from "@/components/DoctorProfiles";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { AuthForm } from "@/components/AuthForm";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Header } from "@/components/Header";
import { Chatbot } from "@/components/Chatbot";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check admin role when session changes
        if (session?.user) {
          checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
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
        <DoctorProfiles onDoctorSelect={setSelectedDoctor} />
        <AppointmentBooking user={user} preSelectedDoctor={selectedDoctor} />
      </main>
      <Chatbot />
    </div>
  );
};

export default Index;