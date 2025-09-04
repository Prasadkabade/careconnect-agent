import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Shield, Star } from "lucide-react";
import heroImage from "@/assets/medical-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                  #1 Healthcare Platform
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Health,{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Our Priority
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Book appointments with top-rated doctors, manage your health records, 
                and get expert medical care - all in one secure platform.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="hero-shadow">
                <Calendar className="mr-2 h-5 w-5" />
                Book Appointment
              </Button>
              <Button variant="outline" size="lg">
                <Clock className="mr-2 h-5 w-5" />
                Emergency Care
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">4.9/5 Rating</span>
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                50,000+ Patients Trust Us
              </div>
            </div>
          </div>

          {/* Hero Image & Stats */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden hero-shadow">
              <img 
                src={heroImage} 
                alt="Professional healthcare team providing quality medical care"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>

            {/* Floating Stats Cards */}
            <Card className="absolute -left-6 top-1/4 w-48 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Expert Doctors</div>
              </CardContent>
            </Card>

            <Card className="absolute -right-6 bottom-1/4 w-48 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-accent">24/7</div>
                <div className="text-sm text-muted-foreground">Available Support</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;