import React, { useEffect, useState } from "react";
import api from "../utils/api";

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/leaderboard")
      .then((res) => setLeaders(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg">
        Loading leaderboard...
      </div>
    );

  if (!leaders.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10">
        <h2 className="text-3xl font-bold mb-4 text-teal-600 dark:text-teal-400">
          Leaderboard 🏆
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No players yet — be the first to take the quiz!
        </p>
      </div>
    );

  const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-700"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center mb-10 text-teal-600 dark:text-teal-400">
          🏆 Global Leaderboard
        </h2>

        <div className="overflow-x-auto bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl transition-all duration-300">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-teal-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-sm">
                <th className="py-3 px-4 text-left">Rank</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left hidden sm:table-cell">
                  Email
                </th>
                <th className="py-3 px-4 text-right">Coins</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((user, index) => (
                <tr
                  key={user._id}
                  className={`border-b border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700/60 transition-all duration-200 ${
                    index < 3 ? "animate-fade-in" : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
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

                  <td className="py-3 px-4 text-gray-800 dark:text-gray-100 font-medium">
                    {user.name}
                  </td>

                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {user.email}
                  </td>

                  <td className="py-3 px-4 text-right text-teal-600 dark:text-teal-400 font-semibold">
                    {user.coins.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Highlight the Top 3 in a Card */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {leaders.slice(0, 3).map((user, i) => (
            <div
              key={user._id}
              className={`p-6 rounded-xl shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border-t-4 ${
                i === 0
                  ? "border-yellow-400"
                  : i === 1
                  ? "border-gray-300"
                  : "border-amber-700"
              } animate-pop`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <h3 className="text-2xl font-bold mb-1">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {user.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {user.email}
              </p>
              <p className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                {user.coins.toLocaleString()} coins
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
