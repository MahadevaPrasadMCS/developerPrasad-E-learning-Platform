// inside your component

// ✨ Enhanced NavItem
const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group
      ${isActive
        ? "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-900/40 font-semibold"
        : "text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-gray-800/60"
      }`
    }
    onClick={() => setMenuOpen(false)}
  >
    {label}
    {/* Animated underline */}
    <span
      className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-teal-500 dark:bg-teal-400 rounded-full transition-all duration-300 group-hover:w-3/4 ${
        window.location.pathname === to ? "w-3/4" : ""
      }`}
    ></span>
  </NavLink>
);

return (
  <div className="flex flex-col min-h-screen">
    {/* 🌙 Navbar */}
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg shadow-md border-b border-gray-100 dark:border-gray-800 transition-all">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <img
            src={require("../assets/logo.png")}
            alt="logo"
            className="h-9 w-9 rounded-full"
          />
          <h1 className="text-xl font-semibold text-teal-600 dark:text-teal-400 tracking-wide">
            YouLearnHub
          </h1>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-3">
          {!token ? (
            <>
              <NavItem to="/" label="Home" />

              {/* Visit Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => {
                  if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
                  setDropdown("more");
                }}
                onMouseLeave={() => {
                  dropdownTimer.current = setTimeout(() => setDropdown(null), 200);
                }}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    dropdown === "more"
                      ? "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-900/40"
                      : "text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-gray-800/60"
                  }`}
                  onClick={() => setDropdown(dropdown === "more" ? null : "more")}
                >
                  Visit
                  {dropdown === "more" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <div
                  className={`absolute left-0 mt-2 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[160px] backdrop-blur-md transition-all duration-200 ${
                    dropdown === "more"
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-1 pointer-events-none"
                  }`}
                >
                  {moreLinks.map((link) => (
                    <NavItem key={link.to} to={link.to} label={link.label} />
                  ))}
                </div>
              </div>

              <NavItem to="/register" label="Register" />
              <NavItem to="/login" label="Login" />
            </>
          ) : (
            groupedLinks.map((group, idx) => (
              <div
                key={idx}
                className="relative group"
                onMouseEnter={() => {
                  if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
                  setDropdown(idx);
                }}
                onMouseLeave={() => {
                  dropdownTimer.current = setTimeout(() => setDropdown(null), 200);
                }}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    dropdown === idx
                      ? "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-900/40"
                      : "text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-gray-800/60"
                  }`}
                  onClick={() => setDropdown(dropdown === idx ? null : idx)}
                >
                  {group.label}
                  {dropdown === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <div
                  className={`absolute left-0 mt-2 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[180px] backdrop-blur-md transition-all duration-200 ${
                    dropdown === idx
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-1 pointer-events-none"
                  }`}
                >
                  {group.items.map((i) => (
                    <NavItem key={i.to} to={i.to} label={i.label} />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Logout */}
          {token && (
            <button
              onClick={handleLogout}
              className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm shadow-md transition-transform hover:scale-105"
            >
              Logout
            </button>
          )}
        </ul>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {menuOpen ? "✖" : "☰"}
        </button>
      </div>
    </nav>
  </div>
);
