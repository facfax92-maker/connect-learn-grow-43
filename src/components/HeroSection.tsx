import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" style={{ background: "var(--hero-gradient)" }}>
      {/* Decorative circles */}
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative z-10 px-4 pt-24 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight max-w-3xl mx-auto"
        >
          Find Your Perfect Tutor, Learn Anything
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 text-lg text-primary-foreground/70 max-w-xl mx-auto"
        >
          Connect with expert tutors in any subject. Personalized learning, on your schedule.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 max-w-2xl mx-auto bg-background/95 backdrop-blur rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-xl"
        >
          <input
            type="text"
            placeholder="Subject (e.g. Math, Piano)"
            className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="text"
            placeholder="Grade / Level"
            className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button size="lg" className="gap-2 px-6">
            <Search size={18} />
            Search
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
