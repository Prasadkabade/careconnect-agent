import { Button } from "@/components/ui/button";
import { Heart, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 transition-medical">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              MediBook
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-foreground hover:text-primary transition-colors">
              Services
            </a>
            <a href="#doctors" className="text-foreground hover:text-primary transition-colors">
              Doctors
            </a>
            <a href="#booking" className="text-foreground hover:text-primary transition-colors">
              Book Appointment
            </a>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </span>
                <Button
                  variant="outline"
                  onClick={signOut}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
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
              <a href="#services" className="text-foreground hover:text-primary transition-medical">
                Services
              </a>
              <a href="#doctors" className="text-foreground hover:text-primary transition-medical">
                Doctors
              </a>
              <a href="#booking" className="text-foreground hover:text-primary transition-medical">
                Book Appointment
              </a>
              <div className="pt-4">
                {user ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Welcome, {user.email}
                    </p>
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
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