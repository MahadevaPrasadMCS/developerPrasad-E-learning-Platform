import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Announcements() {
  const { token, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    weekNumber: "",
    winners: [{ name: "", coins: 0 }],
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Fetch announcements
  useEffect(() => {
    api
      .get("/announcements")
      .then((res) => setAnnouncements(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Post new (admin only)
  const postAnnouncement = async () => {
    if (!form.title || !form.message || !form.weekNumber) {
      setMsg("⚠️ Please fill in all fields before posting.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/announcements", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg("✅ Announcement posted successfully!");
      setForm({ title: "", message: "", weekNumber: "", winners: [{ name: "", coins: 0 }] });
      const updated = await api.get("/announcements");
      setAnnouncements(updated.data);
    } catch (err) {
      console.error(err);
      setMsg("❌ Error posting announcement (admins only).");
    } finally {
      setLoading(false);
    }
  };

  const addWinner = () => {
    setForm({ ...form, winners: [...form.winners, { name: "", coins: 0 }] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <h2 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400 mb-8">
          📢 Announcements
        </h2>

        {/* Admin Posting Section */}
        {user?.role === "admin" && (
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg p-8 transition-all duration-500">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b pb-2">
              Create New Announcement
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                className="border p-3 w-full rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <textarea
                placeholder="Message"
                className="border p-3 w-full rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                rows="4"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />

              <input
                type="number"
                placeholder="Week Number"
                className="border p-3 w-full rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                value={form.weekNumber}
                onChange={(e) => setForm({ ...form, weekNumber: e.target.value })}
              />

              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  🏆 Top Winners
                </h4>
                {form.winners.map((winner, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Name"
                      className="border p-2 flex-1 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      value={winner.name}
                      onChange={(e) => {
                        const updated = [...form.winners];
                        updated[i].name = e.target.value;
                        setForm({ ...form, winners: updated });
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Coins"
                      className="border p-2 w-28 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      value={winner.coins}
                      onChange={(e) => {
                        const updated = [...form.winners];
                        updated[i].coins = Number(e.target.value);
                        setForm({ ...form, winners: updated });
                      }}
                    />
                  </div>
                ))}

                <button
                  onClick={addWinner}
                  className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  + Add Winner
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={postAnnouncement}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-semibold text-white shadow-md transition-all duration-300 ${
                    loading
                      ? "bg-teal-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700 hover:scale-[1.02]"
                  }`}
                >
                  {loading ? "Posting..." : "Post Announcement"}
                </button>
              </div>

              {msg && (
                <p
                  className={`mt-3 text-center font-medium ${
                    msg.includes("✅")
                      ? "text-green-600"
                      : msg.includes("⚠️")
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {msg}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Public Announcement Feed */}
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">
              No announcements yet.
            </p>
          ) : (
            announcements.map((a) => (
              <div
                key={a._id}
                className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h3 className="text-2xl font-semibold text-teal-600 dark:text-teal-400">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                    Week {a.weekNumber} •{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
                  {a.message}
                </p>

                {a.winners && a.winners.length > 0 && (
                  <div className="mt-4 bg-teal-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      🏆 Top Winners
                    </h4>
                    <ul className="space-y-1">
                      {a.winners.map((w, i) => (
                        <li
                          key={i}
                          className="text-gray-700 dark:text-gray-300 flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1"
                        >
                          <span>{w.name}</span>
                          <span className="text-teal-600 dark:text-teal-400 font-medium">
                            +{w.coins} coins
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Announcements;
