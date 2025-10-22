import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import heroImage from "@/assets/hero-phone.jpg";

export const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      <div className="absolute inset-0 bg-[var(--gradient-subtle)]" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Your business card
              <span className="block bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                just got an upgrade
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              The easiest way to share who you are and never lose a contact again.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="group" onClick={() => navigate("/auth")}>
                Create my card
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                For teams
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Rated 4.9/5 on 150,000+ reviews
              </p>
            </div>
          </div>
          
          <div className="relative lg:block flex justify-center">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-20 blur-3xl rounded-full" />
              <img 
                src={heroImage} 
                alt="Digital business card on smartphone" 
                className="relative z-10 w-full h-auto rounded-2xl shadow-2xl animate-float"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
