"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function LeafLoader() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Left Leaf */}
      <motion.div
        className="absolute bottom-0 left-2 origin-bottom-right text-emerald-400"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
          rotate: [-30, -35, -30],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0,
        }}
      >
        <Leaf size={48} className="fill-current" />
      </motion.div>

      {/* Center Leaf */}
      <motion.div
        className="absolute bottom-4 z-10 origin-bottom text-emerald-600"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.8, 1, 0.8],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      >
        <Leaf size={56} className="fill-current" />
      </motion.div>

      {/* Right Leaf */}
      <motion.div
        className="absolute bottom-0 right-2 origin-bottom-left text-emerald-500"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
          rotate: [30, 35, 30],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
      >
        <Leaf size={48} className="fill-current" />
      </motion.div>
    </div>
  );
}
