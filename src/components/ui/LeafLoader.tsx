"use client";

import { Leaf } from "lucide-react";

export default function LeafLoader() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Left Leaf - CSS animation ilə */}
      <div
        className="absolute bottom-0 left-2 origin-bottom-right text-emerald-400 animate-leaf-left"
      >
        <Leaf size={48} className="fill-current" />
      </div>

      {/* Center Leaf */}
      <div
        className="absolute bottom-4 z-10 origin-bottom text-emerald-600 animate-leaf-center"
      >
        <Leaf size={56} className="fill-current" />
      </div>

      {/* Right Leaf */}
      <div
        className="absolute bottom-0 right-2 origin-bottom-left text-emerald-500 animate-leaf-right"
      >
        <Leaf size={48} className="fill-current" />
      </div>

      <style jsx>{`
        @keyframes leafLeft {
          0%, 100% { transform: scale(1) rotate(-30deg); opacity: 0.5; }
          50% { transform: scale(1.2) rotate(-35deg); opacity: 1; }
        }
        @keyframes leafCenter {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
          50% { transform: scale(1.25) translateY(-5px); opacity: 1; }
        }
        @keyframes leafRight {
          0%, 100% { transform: scale(1) rotate(30deg); opacity: 0.5; }
          50% { transform: scale(1.2) rotate(35deg); opacity: 1; }
        }
        .animate-leaf-left {
          animation: leafLeft 2s ease-in-out infinite;
        }
        .animate-leaf-center {
          animation: leafCenter 2s ease-in-out 0.3s infinite;
        }
        .animate-leaf-right {
          animation: leafRight 2s ease-in-out 0.6s infinite;
        }
      `}</style>
    </div>
  );
}
