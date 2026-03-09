import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Handles in-page hash navigation (e.g. /#how-it-works) across route changes.
 */
const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    // If we have a hash, scroll to it.
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    // Otherwise, default to top on normal navigation.
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname, location.hash]);

  return null;
};

export default ScrollToHash;
