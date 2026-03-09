import { motion } from "framer-motion";
import { Star } from "lucide-react";

const tutors = [
  { name: "Sita Sharma", subject: "SEE Mathematics", rating: 4.9 },
  { name: "Rajesh Adhikari", subject: "NEB Physics", rating: 5.0 },
  { name: "Anita Gurung", subject: "English Communication", rating: 4.8 },
  { name: "Bikash Thapa", subject: "IOE Entrance Prep", rating: 4.9 },
  { name: "Priya Joshi", subject: "NEB Chemistry", rating: 4.7 },
  { name: "Manish Shrestha", subject: "Loksewa Preparation", rating: 5.0 },
];

const FeaturedTutors = () => (
  <section id="featured-tutors" className="py-20">
    <div className="container px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl sm:text-4xl font-bold text-center"
      >
        Featured Tutors
      </motion.h2>
      <p className="text-center text-muted-foreground mt-3">Top-rated educators across Nepal ready to help you succeed</p>

      <div className="mt-12 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {tutors.map((tutor, i) => (
          <motion.div
            key={tutor.name}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="min-w-[260px] snap-start bg-background rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-2xl font-display font-bold text-accent-foreground mb-4">
              {tutor.name.split(" ").map(n => n[0]).join("")}
            </div>
            <h3 className="font-semibold text-foreground">{tutor.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{tutor.subject}</p>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <Star className="text-primary fill-primary" size={14} />
              <span className="font-medium">{tutor.rating}</span>
            </div>
            
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedTutors;
