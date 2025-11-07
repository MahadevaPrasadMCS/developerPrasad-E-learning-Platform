// client/src/pages/TermsAndConditions.jsx
import React from "react";

function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-100 py-12 px-6">
      <div className="max-w-5xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl rounded-2xl p-8 animate-fade-in">
        <h1 className="text-4xl font-bold text-teal-600 dark:text-teal-400 mb-6 text-center">
          Terms and Conditions
        </h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          Welcome to <strong>YouLearnHub</strong>, developed by{" "}
          <strong>developerPrasad (dP)</strong>. By accessing or using this platform,
          you agree to comply with these Terms and Conditions. Please read them
          carefully before proceeding.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          1. Use of Platform
        </h2>
        <p className="mb-4">
          Learners may use YouLearnHub to access tutorials, quizzes, and community
          resources for educational purposes only. Unauthorized use, copying, or
          distribution of platform materials is strictly prohibited.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          2. Account Responsibilities
        </h2>
        <p className="mb-4">
          You are responsible for maintaining the confidentiality of your account and
          ensuring that all activities under your account comply with these Terms.
          YouLearnHub is not liable for any loss arising from unauthorized account
          access.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          3. Intellectual Property
        </h2>
        <p className="mb-4">
          All platform content, including tutorials, quizzes, design, and graphics, are
          the property of developerPrasad and YouLearnHub. Reproduction or redistribution
          without permission is prohibited.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          4. Limitation of Liability
        </h2>
        <p className="mb-4">
          YouLearnHub provides educational resources “as is” without any guarantees of
          accuracy or performance. We are not responsible for any damages or losses
          arising from use of the platform.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          5. Modifications and Updates
        </h2>
        <p className="mb-4">
          We reserve the right to modify or update these Terms at any time. Continued
          use of YouLearnHub after updates constitutes acceptance of the revised Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-2 text-teal-600 dark:text-teal-400">
          6. Contact
        </h2>
        <p className="mb-4">
          For any questions or concerns regarding these Terms, please contact us at{" "}
          <a
            href="mailto:mahadevaprasadcs26@gmail.com"
            className="text-teal-500 hover:underline"
          >
            mahadevaprasadcs26@gmail.com
          </a>
          .
        </p>

        <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} YouLearnHub by developerPrasad. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default TermsAndConditions;
