import { Smartphone, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Smartphone,
    title: "Create your card in seconds",
    description: "Personalize your own digital business cards with your headshot, logo and slick design templates. New job title? New logo? No problem. Update your card instantly.",
    label: "The easiest business card you'll ever use"
  },
  {
    icon: Share2,
    title: "Share your card with anyone, any way",
    description: "Scan. Tap. Done. QR, NFC, or link - your details land instantly even if they don't have the app.",
    label: "So much more than a business card"
  },
  {
    icon: Users,
    title: "Never forget a face, or a moment",
    description: "Keep track of who you met and when. Add context to your contacts so you always have an edge.",
    label: "Smart contact management"
  }
];

export const Features = () => {
  return (
    <section className="py-24 px-4 bg-card/30">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-20">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'md:grid-flow-dense' : ''
              }`}
            >
              <div className={`space-y-6 ${index % 2 === 1 ? 'md:col-start-2' : ''}`}>
                <span className="text-sm uppercase tracking-wider text-primary font-semibold">
                  {feature.label}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  {feature.title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <Button variant="hero" size="lg">
                  Create my card
                </Button>
              </div>
              
              <div className={`${index % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}`}>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 rounded-full" />
                  <div className="relative bg-card border border-border rounded-2xl p-12 flex items-center justify-center aspect-square hover:border-primary/50 transition-all duration-300">
                    <feature.icon className="w-32 h-32 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
