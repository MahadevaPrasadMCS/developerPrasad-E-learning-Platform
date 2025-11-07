import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Leaderboard() {
  const { user, handleAuthError } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard");
        setLeaders(res.data || []);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        handleAuthError(err.response?.status, err.response?.data?.message);
        setError("Unable to load leaderboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [handleAuthError]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg">
        Loading leaderboard...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 py-6 px-10 rounded-xl shadow-md text-center">
          {error}
        </div>
      </div>
    );

  if (!leaders.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10">
        <h2 className="text-3xl font-bold mb-4 text-teal-600 dark:text-teal-400">
          Leaderboard 🏆
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No players yet — be the first to take a quiz!
        </p>
      </div>
    );

  // 🏅 Medal & Highlight styles
  const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-700"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center mb-10 text-teal-600 dark:text-teal-400 drop-shadow-sm">
          🏆 Global Leaderboard
        </h2>

        {/* 🧾 Table View */}
        <div className="overflow-x-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-teal-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-sm">
                <th className="py-3 px-4 text-left">Rank</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left hidden sm:table-cell">
                  Email
                </th>
                <th className="py-3 px-4 text-right">Coins</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((player, index) => {
                const isMe = user && player._id === user._id;
                return (
                  <tr
                    key={player._id}
                    className={`border-b border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                      isMe ? "bg-teal-50/60 dark:bg-gray-700/40 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold flex items-center gap-2">
                      {index < 3 ? (
                        <span className={`text-2xl ${medalColors[index]}`}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </span>
                      )}
                      <span className="text-gray-700 dark:text-gray-200 font-medium">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                      {player.name}
                      {isMe && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-700/40 text-teal-700 dark:text-teal-300 font-semibold">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {player.email}
                    </td>
                    <td className="py-3 px-4 text-right text-teal-600 dark:text-teal-400 font-semibold">
                      {player.coins.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 🥇 Top 3 Cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {leaders.slice(0, 3).map((player, i) => (
            <div
              key={player._id}
              className={`p-6 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 border-t-4 backdrop-blur-md ${
                i === 0
                  ? "border-yellow-400"
                  : i === 1
                  ? "border-gray-300"
                  : "border-amber-700"
              } transform hover:-translate-y-1 transition-all duration-300`}
            >
              <h3 className="text-2xl font-bold mb-1">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {player.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {player.email}
              </p>
              <p className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                {player.coins.toLocaleString()} coins
              </p>
            </div>
          ))}
        </div>

        {/* 👤 My Rank Card */}
        {user && (
          <div className="mt-12 text-center">
            {leaders.findIndex((u) => u._id === user._id) !== -1 ? (
              <div className="inline-block px-6 py-3 bg-teal-600 text-white rounded-xl shadow-md">
                Your Current Rank:{" "}
                <span className="font-bold">
                  #
                  {leaders.findIndex((u) => u._id === user._id) + 1}
                </span>{" "}
                | 💰 {user.coins} coins
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                You haven’t appeared on the leaderboard yet. Take quizzes to
                earn coins!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
