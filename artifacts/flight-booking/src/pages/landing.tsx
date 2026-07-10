import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plane, ChevronRight, Globe, Star, Shield, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-bold text-primary tracking-tight">SkyReserve</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
            <Link href="/sign-up" className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-md text-sm font-medium transition-all shadow-md">
              Book a Flight
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80" 
              alt="Clouds from airplane" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
          </div>
          
          <div className="container mx-auto px-4 z-10 grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground leading-[1.1] mb-6">
                Elevate the way <br/>you <span className="text-accent italic">travel</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Experience the world's most premium flight booking platform. Effortless reservations, curated airlines, and uncompromising elegance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-md text-lg font-medium transition-all shadow-lg flex items-center justify-center gap-2 group">
                  Start Your Journey
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/sign-in" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-8 py-4 rounded-md text-lg font-medium transition-all flex items-center justify-center">
                  View Experiences
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">The SkyReserve Standard</h2>
              <p className="text-muted-foreground text-lg">We've redesigned flight booking from the ground up, focusing on clarity, speed, and premium service.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Globe className="w-8 h-8 text-accent" />}
                title="Global Network"
                description="Access to over 400 premium airlines worldwide, seamlessly connected through our bespoke booking engine."
              />
              <FeatureCard 
                icon={<Star className="w-8 h-8 text-accent" />}
                title="Curated Experiences"
                description="From intuitive seat selection to premium cabin upgrades, every detail of your journey is considered."
              />
              <FeatureCard 
                icon={<Shield className="w-8 h-8 text-accent" />}
                title="Secure & Private"
                description="Bank-grade encryption for all transactions with strict privacy controls for your personal travel data."
              />
            </div>
          </div>
        </section>
        
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="bg-primary rounded-2xl p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10">
                <Plane className="w-96 h-96" />
              </div>
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-6 relative z-10">Ready for departure?</h2>
              <p className="text-primary-foreground/80 text-xl mb-10 max-w-2xl mx-auto relative z-10">Join SkyReserve today and discover a new echelon of travel management.</p>
              <Link href="/sign-up" className="inline-flex items-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-4 rounded-md text-lg font-medium transition-all shadow-lg relative z-10">
                <Search className="w-5 h-5" />
                Search Flights Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar border-t border-border/40 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold text-primary">SkyReserve</span>
          </div>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} SkyReserve Global. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-background border border-border/50 rounded-xl p-8 hover:shadow-lg transition-all hover:-translate-y-1"
    >
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="font-serif text-2xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}