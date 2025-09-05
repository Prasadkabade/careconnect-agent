import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope, Calendar, LogOut, Phone } from "lucide-react";
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user?: User | null;
  onSignOut?: () => void;
}

export const Header = ({ user, onSignOut }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 transition-medical">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">MediBook</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-foreground hover:text-primary transition-medical font-medium">
              Services
            </a>
            <a href="#doctors" className="text-foreground hover:text-primary transition-medical font-medium">
              Doctors
            </a>
            <a href="#appointments" className="text-foreground hover:text-primary transition-medical font-medium">
              Book Appointment
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-medical font-medium">
              Contact
            </a>
          </nav>

          {/* Desktop Auth/User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onSignOut}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
                <Button className="bg-gradient-primary hover:opacity-90 text-white" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-medical"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <nav className="flex flex-col space-y-4">
              <a href="#services" className="text-foreground hover:text-primary transition-medical font-medium">
                Services
              </a>
              <a href="#doctors" className="text-foreground hover:text-primary transition-medical font-medium">
                Doctors
              </a>
              <a href="#appointments" className="text-foreground hover:text-primary transition-medical font-medium">
                Book Appointment
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-medical font-medium">
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground px-2">
                      Welcome, {user.email}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onSignOut}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                    <Button className="bg-gradient-primary hover:opacity-90 text-white" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Emergency
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;