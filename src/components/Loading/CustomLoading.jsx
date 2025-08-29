import React from "react";

function ProgressLoading({ fullscreen = false, color = "#0001FB" }) {
  return (
    <div
      className={`${fullscreen ? "fixed top-0 left-0 w-full z-50" : "w-full"}`}
    >
      <div className="h-1 w-full bg-gray-200 relative overflow-hidden">
        <div
          className="absolute h-1 animate-progress"
          style={{ backgroundColor: color, width: "40%" }}
        ></div>
      </div>

      {/* animation style */}
      <style>{`
        @keyframes progress {
          0%   { left: -40%; }
          50%  { left: 20%; }
          100% { left: 100%; }
        }
        .animate-progress {
          animation: progress 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default ProgressLoading;
