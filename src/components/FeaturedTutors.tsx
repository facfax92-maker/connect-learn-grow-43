import { motion } from "framer-motion";
import { Star } from "lucide-react";

const tutors = [
  { name: "Sarah Johnson", subject: "Mathematics", rating: 4.9, rate: 45 },
  { name: "David Chen", subject: "Physics", rating: 5.0, rate: 55 },
  { name: "Emily Rivera", subject: "English Literature", rating: 4.8, rate: 40 },
  { name: "James Okonkwo", subject: "Computer Science", rating: 4.9, rate: 60 },
  { name: "Priya Patel", subject: "Chemistry", rating: 4.7, rate: 42 },
  { name: "Marcus Lee", subject: "Music Theory", rating: 5.0, rate: 50 },
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
      <p className="text-center text-muted-foreground mt-3">Top-rated educators ready to help you succeed</p>

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
            <p className="mt-3 text-lg font-bold text-primary">${tutor.rate}<span className="text-xs font-normal text-muted-foreground">/hr</span></p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedTutors;
