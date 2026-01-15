import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

const FAQ_DATA = [
  {
    category: "About the Platform",
    items: [
      {
        q: "What is this platform about?",
        a: "This platform helps learners choose skills to learn and track their progress using a Skill Radar. Skill levels update as users watch videos and complete quizzes, making learning engaging, competitive, and measurable.",
      },
      {
        q: "How is this platform different from traditional learning platforms?",
        a: "Unlike course-based platforms, this system focuses on skill mastery. Progress is visualized using the Skill Radar, helping learners understand how proficient they are rather than just completing content.",
      },
      {
        q: "Is this platform free to use?",
        a: "Yes. Core learning features are free. Premium resources and videos can be unlocked using coins earned through learning activities.",
      },
      {
        q: "Who is this platform for?",
        a: "This platform is suitable for beginners, students, professionals, and anyone interested in structured skill development.",
      },
    ],
  },
  {
    category: "Skills & Skill Radar",
    items: [
      {
        q: "What is the Skill Radar?",
        a: "The Skill Radar is a visual system that shows your proficiency level for each skill based on completed videos, quiz performance, and learning milestones.",
      },
      {
        q: "How often does the Skill Radar update?",
        a: "The Skill Radar updates automatically whenever you complete videos, attempt quizzes, or achieve skill milestones.",
      },
      {
        q: "Can my skill level decrease?",
        a: "No. Skill levels only increase based on verified learning activities.",
      },
      {
        q: "What does a maximum skill level mean?",
        a: "A maximum skill level indicates mastery of a skill, achieved by completing required learning content and consistently performing well in quizzes.",
      },
    ],
  },
  {
    category: "Learning Content",
    items: [
      {
        q: "What types of learning content are available?",
        a: "The platform currently supports recorded videos, curated YouTube videos, and PDF resources.",
      },
      {
        q: "Are all resources paid?",
        a: "No. Basic resources like introductions and syllabi are free. Advanced and premium resources require coins to unlock.",
      },
      {
        q: "Who creates the learning content?",
        a: "Content is created by platform-approved Instructors and verified contributors, and reviewed by Admins.",
      },
      {
        q: "Is content updated regularly?",
        a: "Yes. Content is periodically reviewed to maintain quality and relevance.",
      },
    ],
  },
  {
    category: "Quizzes & Evaluation",
    items: [
      {
        q: "What types of quizzes are available?",
        a: "There are Daily Quizzes for practice and Weekly Quizzes designed as competitive assessments.",
      },
      {
        q: "Can I retake quizzes?",
        a: "Daily quizzes can be retaken until the next quiz is published. Weekly quizzes can only be attempted once.",
      },
      {
        q: "How are quizzes evaluated?",
        a: "Quizzes are automatically evaluated, and results directly affect skill progression and coin rewards.",
      },
      {
        q: "What if I face a technical issue during a quiz?",
        a: "You can report the issue through the Contact page. After review, a reattempt may be granted.",
      },
    ],
  },
  {
    category: "Coins & Wallet",
    items: [
      {
        q: "What are coins?",
        a: "Coins are in-platform rewards earned through learning activities such as watching videos and completing quizzes.",
      },
      {
        q: "How can I earn coins?",
        a: "Coins are earned by watching videos, completing quizzes, and progressing skill levels.",
      },
      {
        q: "What can coins be used for?",
        a: "Coins can be used to unlock premium videos and advanced learning resources.",
      },
      {
        q: "Do coins expire?",
        a: "No. Coins remain valid as long as your account exists.",
      },
    ],
  },
  {
    category: "Roles & Promotions",
    items: [
      {
        q: "What roles exist on the platform?",
        a: "The platform supports Student, Instructor, Moderator, Admin, and CEO roles.",
      },
      {
        q: "How can a student become an instructor?",
        a: "Students who complete 4–5 skills at the maximum level can apply for the Instructor role. Admin approval is required.",
      },
      {
        q: "Are instructors monitored?",
        a: "Yes. All instructor activity is monitored by Admins to ensure quality and platform integrity.",
      },
      {
        q: "Can an instructor be demoted?",
        a: "Yes. Instructors may be demoted if they violate guidelines or remain inactive.",
      },
    ],
  },
  {
    category: "Community & Safety",
    items: [
      {
        q: "What can users do in the community?",
        a: "Users can join communities, create posts, comment, react, and report inappropriate content.",
      },
      {
        q: "How are reports handled?",
        a: "Reports follow a strict flow: User → Moderator → Admin.",
      },
      {
        q: "What happens if my account is restricted?",
        a: "You will be notified and given 5–7 days to correct the reported behavior before further action is taken.",
      },
      {
        q: "Is anonymous activity allowed?",
        a: "Anonymous activity is monitored. Misuse may lead to warnings or restrictions.",
      },
    ],
  },
  {
    category: "Account & Security",
    items: [
      {
        q: "Is email verification mandatory?",
        a: "Currently optional, but recommended for better security and account recovery.",
      },
      {
        q: "How does password reset work?",
        a: "Password reset is secured via OTP sent to your registered email.",
      },
      {
        q: "Is my data safe?",
        a: "Yes. The platform uses secure authentication, role-based access control, and moderation workflows.",
      },
    ],
  },
  {
    category: "Support & Contact",
    items: [
      {
        q: "How can I contact support?",
        a: "You can reach support through the Contact page or via official support email.",
      },
      {
        q: "When will I receive a response?",
        a: "Most support requests are answered within 48 hours.",
      },
      {
        q: "Can I appeal a moderation decision?",
        a: "Yes. Appeals can be submitted through the Contact page and are reviewed by Admins.",
      },
    ],
  },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Find answers about learning, skills, coins, roles, and platform
            policies.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* FAQ Sections */}
        {FAQ_DATA.map((section, si) => (
          <div key={si} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {section.category}
            </h2>

            {section.items
              .filter(
                (item) =>
                  item.q.toLowerCase().includes(search.toLowerCase()) ||
                  item.a.toLowerCase().includes(search.toLowerCase())
              )
              .map((item, i) => {
                const idx = `${si}-${i}`;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md"
                  >
                    <button
                      onClick={() => setOpen(open === idx ? null : idx)}
                      className="w-full flex justify-between items-center p-5 text-left"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`transition-transform ${
                          open === idx ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {open === idx && (
                      <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQ;
