import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Calendar,
  MapPin,
  GraduationCap,
  Award
} from "lucide-react";

const doctors = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    experience: "15+ years",
    rating: 4.9,
    reviews: 324,
    education: "Harvard Medical School",
    languages: ["English", "Spanish"],
    availability: "Available Today",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop",
    specialties: ["Heart Surgery", "Preventive Cardiology", "Arrhythmia"]
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Neurologist",
    experience: "12+ years",
    rating: 4.8,
    reviews: 289,
    education: "Johns Hopkins University",
    languages: ["English", "Mandarin"],
    availability: "Next Available: Tomorrow",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
    specialties: ["Stroke Care", "Epilepsy", "Movement Disorders"]
  },
  {
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrician",
    experience: "10+ years",
    rating: 4.9,
    reviews: 456,
    education: "Stanford Medical School",
    languages: ["English", "Spanish", "French"],
    availability: "Available Today",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    specialties: ["Newborn Care", "Adolescent Medicine", "Developmental Pediatrics"]
  },
  {
    name: "Dr. James Wilson",
    specialty: "Orthopedic Surgeon",
    experience: "18+ years",
    rating: 4.7,
    reviews: 198,
    education: "Mayo Clinic",
    languages: ["English"],
    availability: "Next Available: 2 days",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop",
    specialties: ["Joint Replacement", "Sports Medicine", "Spine Surgery"]
  }
];

const DoctorProfiles = () => {
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
                    src={doctor.image} 
                    alt={`Dr. ${doctor.name}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-medical"
                  />
                </div>
                
                {/* Availability Badge */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    className={`${
                      doctor.availability.includes('Today') 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    } text-white`}
                  >
                    {doctor.availability}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{doctor.name}</CardTitle>
                    <CardDescription className="text-primary font-semibold text-lg">
                      {doctor.specialty}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{doctor.rating}</span>
                    <span className="text-muted-foreground text-sm">({doctor.reviews})</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Experience & Education */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Award className="h-4 w-4 mr-2 text-accent" />
                    {doctor.experience} experience
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 mr-2 text-accent" />
                    {doctor.education}
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <p className="text-sm font-medium mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.specialties.map((specialty, specIndex) => (
                      <Badge key={specIndex} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <p className="text-sm font-medium mb-2">Languages:</p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.languages.join(", ")}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button 
                    variant="medical" 
                    size="sm" 
                    className="flex-1"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Doctors CTA */}
        <div className="text-center">
          <Button variant="outline" size="lg">
            View All Doctors
            <MapPin className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DoctorProfiles;