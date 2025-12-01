import React from "react";
import logo from "../assets/logo.png"; // adjust if yours is different path

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50 transition-all">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer Circle Spinner */}
        <div className="absolute w-full h-full border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>

        {/* Logo Center */}
        <img
          src={logo}
          alt="Loading..."
          className="w-10 h-10 rounded-full drop-shadow-lg animate-pulse"
        />
      </div>
    </div>
  );
}
