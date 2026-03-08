import { GraduationCap } from "lucide-react";

const Footer = () => (
  <footer className="bg-secondary text-secondary-foreground py-16">
    <div className="container px-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <GraduationCap className="text-primary" size={24} />
            Tutor<span className="text-primary">Connect</span>
          </div>
          <p className="mt-3 text-sm text-secondary-foreground/60 max-w-xs">
            Connecting learners with expert tutors worldwide. Personalized education for everyone.
          </p>
        </div>

        <div>
          <h4 className="font-display font-bold text-sm mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/60">
            <li><a href="#" className="hover:text-primary transition-colors">Find Tutors</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Become a Tutor</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold text-sm mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/60">
            <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold text-sm mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/60">
            <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-secondary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-secondary-foreground/40">© 2026 TutorConnect. All rights reserved.</p>
        <div className="flex gap-4">
          {["Twitter", "Facebook", "Instagram"].map((s) => (
            <a key={s} href="#" className="text-xs text-secondary-foreground/40 hover:text-primary transition-colors">{s}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
