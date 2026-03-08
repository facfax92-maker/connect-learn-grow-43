import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "TutorConnect helped me raise my math grade from a C to an A in just two months. My tutor was amazing!",
    name: "Ava Thompson",
    detail: "High School Student",
  },
  {
    quote: "I finally understand organic chemistry thanks to my tutor on TutorConnect. Worth every penny.",
    name: "Liam Nakamura",
    detail: "College Sophomore",
  },
  {
    quote: "As a parent, I love how easy it is to find qualified tutors. The booking process is seamless.",
    name: "Rachel Martinez",
    detail: "Parent",
  },
];

const Testimonials = () => (
  <section className="py-20">
    <div className="container px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl sm:text-4xl font-bold text-center"
      >
        What Students Say
      </motion.h2>

      <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="bg-muted/50 rounded-2xl p-8 border border-border relative"
          >
            <Quote className="text-primary/20 absolute top-6 right-6" size={32} />
            <p className="text-foreground/80 text-sm leading-relaxed italic">"{t.quote}"</p>
            <div className="mt-6">
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
