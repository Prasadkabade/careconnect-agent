import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Brain, 
  Eye, 
  Bone, 
  Baby, 
  Activity,
  ArrowRight,
  Clock,
  MapPin
} from "lucide-react";

const services = [
  {
    icon: Heart,
    title: "Cardiology",
    description: "Comprehensive heart care with advanced diagnostic tools and expert cardiologists.",
    features: ["ECG Testing", "Heart Surgery", "Preventive Care"],
    color: "text-red-500"
  },
  {
    icon: Brain,
    title: "Neurology",
    description: "Specialized care for neurological conditions with cutting-edge treatments.",
    features: ["MRI Scans", "Neurosurgery", "Stroke Care"],
    color: "text-purple-500"
  },
  {
    icon: Eye,
    title: "Ophthalmology",
    description: "Complete eye care services from routine checkups to complex surgeries.",
    features: ["Eye Exams", "LASIK Surgery", "Retinal Care"],
    color: "text-blue-500"
  },
  {
    icon: Bone,
    title: "Orthopedics",
    description: "Expert bone and joint care with minimally invasive procedures.",
    features: ["Joint Replacement", "Sports Medicine", "Fracture Care"],
    color: "text-orange-500"
  },
  {
    icon: Baby,
    title: "Pediatrics",
    description: "Specialized healthcare for children from infancy through adolescence.",
    features: ["Well-Child Visits", "Immunizations", "Growth Monitoring"],
    color: "text-pink-500"
  },
  {
    icon: Activity,
    title: "General Medicine",
    description: "Comprehensive primary care for adults with preventive focus.",
    features: ["Health Screenings", "Chronic Care", "Wellness Plans"],
    color: "text-green-500"
  }
];

const Services = () => {
  return (
    <section id="services" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Our Medical Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive healthcare services delivered by experienced specialists 
            using the latest medical technology and evidence-based treatments.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={index} className="group hover:scale-105 transition-bounce">
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-bounce`}>
                    <IconComponent className={`h-7 w-7 ${service.color}`} />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-medical">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="medical-gradient text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Emergency Care</h3>
                  <p className="text-white/90 mb-4">24/7 emergency medical services</p>
                  <div className="flex items-center text-sm text-white/80">
                    <Clock className="h-4 w-4 mr-2" />
                    Always Available
                  </div>
                </div>
                <Button variant="outline" className="bg-white text-primary hover:bg-white/90">
                  Call Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Find Locations</h3>
                  <p className="text-white/90 mb-4">Multiple convenient locations</p>
                  <div className="flex items-center text-sm text-white/80">
                    <MapPin className="h-4 w-4 mr-2" />
                    15+ Locations
                  </div>
                </div>
                <Button variant="outline" className="bg-white text-accent hover:bg-white/90">
                  View Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Services;