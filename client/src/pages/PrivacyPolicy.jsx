// client/src/pages/PrivacyPolicy.jsx
import React from "react";

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 py-12 px-6">
      <div className="max-w-5xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl rounded-2xl p-8 animate-fade-in">
        <h1 className="text-4xl font-bold text-teal-600 dark:text-teal-400 mb-6 text-center">
          Privacy Policy
        </h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          Welcome to <strong>YouLearnHub</strong>, a platform developed and maintained by{" "}
          <strong>developerPrasad (dP)</strong>. This Privacy Policy explains how we
          collect, use, and safeguard the information you share with us when you use
          our services.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          1. Information We Collect
        </h2>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Account details such as your name, email, and login credentials.</li>
          <li>Activity data like quizzes taken, rewards earned, and interactions.</li>
          <li>Technical data such as your browser type, device info, and IP address.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          2. How We Use Your Data
        </h2>
        <p className="mb-4">
          We use your data to enhance your learning experience, personalize content,
          improve platform performance, and maintain account security. We do not sell
          or share your personal data with third parties without consent.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          3. Cookies and Analytics
        </h2>
        <p className="mb-4">
          YouLearnHub uses cookies to improve website functionality and analyze user
          interactions. These cookies help us provide relevant learning resources and
          track engagement metrics. By using our platform, you consent to our cookie
          usage.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          4. Third-Party Services
        </h2>
        <p className="mb-4">
          We may integrate third-party tools like Google Analytics or AdSense for
          performance tracking and ad display. These third parties may collect certain
          anonymized data as governed by their respective privacy policies.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          5. Data Protection
        </h2>
        <p className="mb-4">
          Your personal information is stored securely, and we take appropriate
          measures to protect it from unauthorized access, alteration, or disclosure.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          6. Your Rights
        </h2>
        <p className="mb-4">
          Learners can request data deletion or account removal anytime by contacting
          us at{" "}
          <a
            href="mailto:mahadevaprasadcs26@gmail.com"
            className="text-teal-500 hover:underline"
          >
            mahadevaprasadcs26@gmail.com
          </a>
          .
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          7. Updates to this Policy
        </h2>
        <p className="mb-4">
          We may update this Privacy Policy periodically. Learners are encouraged to
          review this page regularly for any changes.
        </p>

        <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} YouLearnHub by developerPrasad. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
