import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2 } from 'lucide-react';

export const SuccessToast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg border bg-green-50 p-4 text-green-800 shadow-lg"
      >
        <CheckCircle2 className="h-5 w-5" />
        <p className="text-sm font-medium">{message}</p>
      </motion.div>
    </AnimatePresence>
  );
};
