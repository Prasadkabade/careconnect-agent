import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Star, 
  Calendar,
  MapPin,
  GraduationCap,
  Award
} from "lucide-react";

interface DoctorProfilesProps {
  onDoctorSelect?: (doctor: any) => void;
}

const DoctorProfiles = ({ onDoctorSelect }: DoctorProfilesProps = {}) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [profileDoctor, setProfileDoctor] = useState<any>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      // Try to fetch from safe_doctors view first (for public access)
      const { data, error } = await supabase
        .from('safe_doctors')
        .select('*');
      
      if (error) {
        console.error('Error fetching doctors:', error);
      } else {
        setDoctors(data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };
  
  const scrollToAppointments = (doctor?: any) => {
    if (doctor && onDoctorSelect) {
      onDoctorSelect(doctor);
    }
    document.getElementById('appointments')?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <section id="doctors" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Meet Our Expert Doctors
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our team of board-certified physicians brings decades of experience 
            and cutting-edge expertise to provide you with the best possible care.
          </p>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {doctors.map((doctor, index) => (
            <Card key={index} className="group hover:scale-[1.02] transition-bounce overflow-hidden">
              <div className="relative">
                 {/* Doctor Image */}
                 <div className="aspect-[16/10] overflow-hidden">
                   <img 
                     src={doctor.avatar_url || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop`} 
                     alt={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                     className="w-full h-full object-cover group-hover:scale-110 transition-medical"
                   />
                 </div>
                
                 {/* Availability Badge */}
                 <div className="absolute top-4 right-4">
                   <Badge 
                     className={`${
                       doctor.is_available 
                         ? 'bg-green-500 hover:bg-green-600' 
                         : 'bg-orange-500 hover:bg-orange-600'
                     } text-white`}
                   >
                     {doctor.is_available ? 'Available' : 'Unavailable'}
                   </Badge>
                 </div>
              </div>

               <CardHeader className="pb-4">
                 <div className="flex items-start justify-between">
                   <div>
                     <CardTitle className="text-2xl">Dr. {doctor.first_name} {doctor.last_name}</CardTitle>
                     <CardDescription className="text-primary font-semibold text-lg">
                       {doctor.specialty}
                     </CardDescription>
                   </div>
                   <div className="flex items-center space-x-1">
                     <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                     <span className="font-semibold">{doctor.rating || 5.0}</span>
                   </div>
                 </div>
               </CardHeader>

               <CardContent className="space-y-4">
                 {/* Experience & Bio */}
                 <div className="space-y-2">
                   {doctor.years_experience && (
                     <div className="flex items-center text-sm text-muted-foreground">
                       <Award className="h-4 w-4 mr-2 text-accent" />
                       {doctor.years_experience}+ years experience
                     </div>
                   )}
                   {doctor.consultation_fee && (
                     <div className="flex items-center text-sm text-muted-foreground">
                       <GraduationCap className="h-4 w-4 mr-2 text-accent" />
                       ${doctor.consultation_fee} consultation
                     </div>
                   )}
                 </div>

                 {/* Bio */}
                 {doctor.bio && (
                   <div>
                     <p className="text-sm text-muted-foreground line-clamp-3">
                       {doctor.bio}
                     </p>
                   </div>
                 )}

                {/* CTA Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button 
                    variant="medical" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => scrollToAppointments(doctor)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setProfileDoctor(doctor)}>
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Doctors CTA */}
        <div className="text-center">
          <Button variant="outline" size="lg" onClick={() => document.getElementById('doctors')?.scrollIntoView({ behavior: 'smooth' })}>
            View All Doctors
            <MapPin className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={!!profileDoctor} onOpenChange={(open) => { if (!open) setProfileDoctor(null); }}>
        <DialogContent>
          {profileDoctor && (
             <>
               <DialogHeader>
                 <DialogTitle>Dr. {profileDoctor.first_name} {profileDoctor.last_name}</DialogTitle>
                 <DialogDescription>{profileDoctor.specialty} • {profileDoctor.years_experience}+ years experience</DialogDescription>
               </DialogHeader>
               <div className="space-y-3">
                 <img 
                   src={profileDoctor.avatar_url || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop`} 
                   alt={`Dr. ${profileDoctor.first_name} ${profileDoctor.last_name}`} 
                   className="w-full h-48 object-cover rounded-lg" 
                 />
                 {profileDoctor.bio && (
                   <p className="text-sm text-muted-foreground">{profileDoctor.bio}</p>
                 )}
                 {profileDoctor.consultation_fee && (
                   <div className="text-sm text-muted-foreground">
                     Consultation Fee: ${profileDoctor.consultation_fee}
                   </div>
                 )}
                 <Button onClick={() => scrollToAppointments(profileDoctor)} className="w-full">Book with this Doctor</Button>
               </div>
             </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

// Explicitly export as default to ensure module resolution
export default DoctorProfiles;