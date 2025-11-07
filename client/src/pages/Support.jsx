import React from "react";
import { HelpCircle, MessageCircle, Info } from "lucide-react";

function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-10 text-center">
          Help & Support
        </h1>

        <div className="grid sm:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <HelpCircle size={40} className="text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              FAQs
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Learn how to earn coins, redeem resources, and use tutorials effectively.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <MessageCircle size={40} className="text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Contact Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Reach out directly through the <span className="text-teal-500 font-medium">Contact</span> page for any issue.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Info size={40} className="text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Platform Updates
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Stay informed via the <span className="text-teal-500 font-medium">Announcements</span> page for all new features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;
