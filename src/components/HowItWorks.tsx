import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, CalendarDays, FileText, MessageSquare, Wallet } from "lucide-react";

const studentSteps = [
  { icon: Search, title: "Search", desc: "Browse tutors by subject, grade level, and city across Nepal." },
  { icon: UserCheck, title: "Book", desc: "Choose your tutor and schedule a session that fits your calendar." },
  { icon: CalendarDays, title: "Learn", desc: "Meet online or in-person and start mastering your subject." },
];

const tutorSteps = [
  { icon: FileText, title: "Create Profile", desc: "Set up your profile showcasing skills, experience, and per-session rate." },
  { icon: MessageSquare, title: "Get Matched", desc: "Students discover your profile and send booking requests." },
  { icon: Wallet, title: "Earn", desc: "Teach on your schedule and receive payments via eSewa or Khalti." },
];

const HowItWorks = () => {
  const [tab, setTab] = useState<"students" | "tutors">("students");
  const steps = tab === "students" ? studentSteps : tutorSteps;

  return (
    <section id="how-it-works" className="py-20 bg-muted/50">
      <div className="container px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl sm:text-4xl font-bold text-center"
        >
          How It Works
        </motion.h2>

        <div className="flex justify-center gap-4 mt-8">
          {(["students", "tutors"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              For {t === "students" ? "Students" : "Tutors"}
            </button>
          ))}
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title + tab}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-background rounded-2xl p-8 text-center shadow-sm border border-border"
            >
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <step.icon className="text-accent-foreground" size={26} />
              </div>
              <h3 className="font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
