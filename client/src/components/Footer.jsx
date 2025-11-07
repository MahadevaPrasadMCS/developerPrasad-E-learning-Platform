import React from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-10 mt-10 text-sm">
      <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-3 gap-8 text-center sm:text-left">
        {/* 🌱 About Section */}
        <div>
          <h3 className="text-teal-600 font-bold mb-3 text-lg">About</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            <span className="text-teal-500 font-semibold">YouLearnHub</span> empowers learners to grow
            through tutorials, quizzes, and rewards — built with dedication by{" "}
            <span className="text-teal-600 font-medium">developerPrasad (dP)</span>.
          </p>
        </div>

        {/* 🔗 Quick Links */}
        <div>
          <h3 className="text-teal-600 font-bold mb-3 text-lg">Quick Links</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li><Link to="/about" className="hover:text-teal-500 transition">About</Link></li>
            <li><Link to="/contact" className="hover:text-teal-500 transition">Contact</Link></li>
            <li><Link to="/support" className="hover:text-teal-500 transition">Support</Link></li>
            <li><Link to="/explore" className="hover:text-teal-500 transition">Explore</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-teal-500 transition">Privacy Policy</Link></li>
            <li><Link to="/terms-and-conditions" className="hover:text-teal-500 transition">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* 🌐 Connect Section */}
        <div>
          <h3 className="text-teal-600 font-bold mb-3 text-lg">Connect</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>
              <a
                href="mailto:mahadevaprasadcs26@gmail.com"
                className="flex items-center gap-2 justify-center sm:justify-start hover:text-teal-500 transition"
              >
                <Mail size={16} /> Email
              </a>
            </li>
            <li>
              <a
                href="https://github.com/MahadevaPrasadMCS"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 justify-center sm:justify-start hover:text-teal-500 transition"
              >
                <Github size={16} /> GitHub
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/in/mahadeva-prasad-m-a603a4388/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 justify-center sm:justify-start hover:text-teal-500 transition"
              >
                <Linkedin size={16} /> LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* ⚡ Footer Bottom */}
      <div className="mt-10 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-5">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="text-teal-500 font-semibold">YouLearnHub</span> — built with ❤️ by{" "}
          <span className="text-teal-600 font-semibold">developerPrasad (dP)</span>
        </p>
        <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
          Learn. Compete. Earn. Grow Together.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
