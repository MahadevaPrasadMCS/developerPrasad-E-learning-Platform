import React from "react";
import {
  HelpCircle,
  MessageCircle,
  Info,
  BookOpen,
  Users,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-4">
            Help & Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers, learn how to use the platform effectively, and get
            help whenever you need it.
          </p>
        </div>

        {/* Quick Help Cards */}
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <HelpCircle size={42} className="text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              FAQs
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Learn how coins work, how promotions happen, and how to use
              quizzes, tutorials, and resources.
              visit our {" "}
              <Link
                to="/faq"
                className="text-teal-500 font-medium hover:underline"
              >
                FAQ's Page
              </Link>{" "}
              for more information.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <MessageCircle size={42} className="text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Contact Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Facing an issue or have a question? Reach us via the{" "}
              <Link
                to="/contact"
                className="text-teal-500 font-medium hover:underline"
              >
                Contact page
              </Link>
              .
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Info size={42} className="text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Platform Updates
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Stay updated with new features, fixes, and announcements.
              Visit the{" "}
              <Link
                to="/announcements"
                className="text-teal-500 font-medium hover:underline"
              >
                Announcements
              </Link>{" "}
              page.
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-teal-500" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Getting Started
            </h2>
          </div>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm list-disc list-inside">
            <li>Create an account and verify your email.</li>
            <li>Explore tutorials, quizzes, and learning paths.</li>
            <li>Earn coins by completing quizzes and activities.</li>
            <li>Redeem coins for resources in the store.</li>
            <li>Engage with the community and climb the leaderboard.</li>
          </ul>
        </section>

        {/* Role-Based Help */}
        <section className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <Users className="text-teal-500 mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Students
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Learn how to participate in quizzes, earn rewards, track progress,
              and interact with the community.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <BookOpen className="text-teal-500 mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Instructors
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get help with creating quizzes, uploading resources, managing
              drafts, and tracking promotions.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <ShieldCheck className="text-teal-500 mb-3" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Admins & Moderators
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Understand moderation tools, approvals, user management, and
              platform security workflows.
            </p>
          </div>
        </section>

        {/* Support Availability */}
        <section className="bg-teal-50 dark:bg-gray-800/70 border border-teal-100 dark:border-gray-700 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="text-teal-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Support Availability
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-3xl">
            Our support team reviews requests regularly. Critical issues such as
            account access, payments, or role changes are prioritized. Please
            provide clear details and screenshots (if applicable) when
            contacting support.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Support;
