import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../lib/api";

export default function AnnouncementBanner() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/settings/public").then((r) => setData(r.data)).catch(() => setData({ announcement_enabled: false }));
  }, []);

  return (
    <AnimatePresence>
      {data?.announcement_enabled && (
        <motion.div data-testid="announcement-banner" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
          className="overflow-hidden bg-ink text-paper">
          <p className="py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.25em]">{data.announcement_text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
