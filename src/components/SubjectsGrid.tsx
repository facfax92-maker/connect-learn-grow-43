import { motion } from "framer-motion";
import { Calculator, Atom, BookOpen, Landmark, Code, Music, Globe, ClipboardCheck } from "lucide-react";

const subjects = [
  { icon: Calculator, label: "Math" },
  { icon: Atom, label: "Science" },
  { icon: BookOpen, label: "English" },
  { icon: Landmark, label: "History" },
  { icon: Code, label: "Coding" },
  { icon: Music, label: "Music" },
  { icon: Globe, label: "Languages" },
  { icon: ClipboardCheck, label: "Test Prep" },
];

const SubjectsGrid = () => (
  <section className="py-20 bg-muted/50">
    <div className="container px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl sm:text-4xl font-bold text-center"
      >
        Explore Subjects
      </motion.h2>
      <p className="text-center text-muted-foreground mt-3">Find expert tutors in any subject</p>

      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {subjects.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background border border-border hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <s.icon className="text-muted-foreground group-hover:text-primary transition-colors" size={32} />
            <span className="text-sm font-semibold">{s.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  </section>
);

export default SubjectsGrid;
