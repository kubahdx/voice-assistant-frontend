"use client";

import { motion } from "framer-motion";

interface VoiceSelectionUIProps {
  onVoiceSelect: (voice: "male" | "female") => void;
}

export function VoiceSelectionUI({ onVoiceSelect }: VoiceSelectionUIProps) {
  return (
    <motion.div
      key="voice-selection"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
      className="grid items-center justify-center h-full bg-[#F6F6F6] gap-4"
    >
      <h2 className="text-xl font-semibold text-center text-gray-700">
        Wybierz głos asystenta:
      </h2>
      <div className="flex gap-4">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="uppercase px-6 py-3 bg-[#A0AEC0] hover:bg-[#718096] text-white rounded-lg shadow-md transition-colors"
          onClick={() => onVoiceSelect("female")}
        >
          Głos Żeński
        </motion.button>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="uppercase px-6 py-3 bg-[#A0AEC0] hover:bg-[#718096] text-white rounded-lg shadow-md transition-colors"
          onClick={() => onVoiceSelect("male")}
        >
          Głos Męski
        </motion.button>
      </div>
    </motion.div>
  );
} 