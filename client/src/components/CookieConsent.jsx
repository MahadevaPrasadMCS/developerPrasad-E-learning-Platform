// client/src/components/CookieConsent.jsx
import React, { useState, useEffect } from "react";

function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50">
      <div className="bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-5 sm:max-w-md mx-auto sm:ml-auto animate-fade-up backdrop-blur-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          🍪 We use cookies to improve your learning experience and analyze website usage.
          By clicking <strong>Accept</strong>, you agree to our{" "}
          <a href="/privacy-policy" className="text-teal-500 hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleDecline}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 text-sm rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
