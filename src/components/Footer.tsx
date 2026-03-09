import { GraduationCap, Mail, Phone } from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/constants";

const ESEWA_NUMBER = "9808031193";
const KHALTI_NUMBER = "9818207798";

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
            Connecting Nepali students with quality tutors across Nepal. Personalized education for everyone.
          </p>
        </div>

        <div>
          <h4 className="font-display font-bold text-sm mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-secondary-foreground/60">
            <li><a href="/tutors" className="hover:text-primary transition-colors">Find Tutors</a></li>
            <li><a href="/signup" className="hover:text-primary transition-colors">Become a Tutor</a></li>
            <li><a href="/#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold text-sm mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm text-secondary-foreground/60">
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail size={14} />
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>
              <a href={`tel:+977${SUPPORT_PHONE.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone size={14} />
                +977 {SUPPORT_PHONE}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold text-sm mb-4">Payment Details</h4>
          <ul className="space-y-3 text-sm">
            <li className="rounded-lg bg-secondary-foreground/5 px-3 py-2">
              <p className="font-semibold text-secondary-foreground/80 text-xs uppercase tracking-wide mb-1">eSewa</p>
              <p className="text-secondary-foreground font-mono font-bold">{ESEWA_NUMBER}</p>
              <p className="text-secondary-foreground/50 text-xs">TutorConnect</p>
            </li>
            <li className="rounded-lg bg-secondary-foreground/5 px-3 py-2">
              <p className="font-semibold text-secondary-foreground/80 text-xs uppercase tracking-wide mb-1">Khalti</p>
              <p className="text-secondary-foreground font-mono font-bold">{KHALTI_NUMBER}</p>
              <p className="text-secondary-foreground/50 text-xs">TutorConnect</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-secondary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-secondary-foreground/40">© 2026 TutorConnect. All rights reserved. 🇳🇵 Made for Nepal</p>
        <div className="flex gap-4">
          {["Facebook", "Instagram"].map((s) => (
            <a key={s} href="#" className="text-xs text-secondary-foreground/40 hover:text-primary transition-colors">{s}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
