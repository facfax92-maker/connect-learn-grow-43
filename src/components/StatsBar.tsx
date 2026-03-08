import { motion } from "framer-motion";
import { Users, BookOpen, CalendarCheck, Star } from "lucide-react";

const stats = [
  { icon: Users, value: "500+", label: "Tutors" },
  { icon: BookOpen, value: "80+", label: "Subjects" },
  { icon: CalendarCheck, value: "10,000+", label: "Sessions Completed" },
  { icon: Star, value: "4.9★", label: "Average Rating" },
];

const StatsBar = () => (
  <section className="bg-secondary py-10">
    <div className="container px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex flex-col items-center text-center"
        >
          <s.icon className="text-primary mb-2" size={28} />
          <span className="text-2xl font-bold text-secondary-foreground">{s.value}</span>
          <span className="text-sm text-secondary-foreground/60">{s.label}</span>
        </motion.div>
      ))}
    </div>
  </section>
);

export default StatsBar;
