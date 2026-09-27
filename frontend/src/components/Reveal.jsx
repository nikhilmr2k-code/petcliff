import { motion } from "framer-motion";

/**
 * Scroll-triggered reveal wrapper: fades and slides its children up
 * when they enter the viewport. Matches the site's understated luxury motion.
 */
export default function Reveal({ children, delay = 0, className = "", y = 24, once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
