import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Wallet() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!token) return;
    const fetchWallet = async () => {
      try {
        const res = await api.get("/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWallet(res.data);
      } catch (err) {
        console.error("Error fetching wallet:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [token]);

  const handleRedeem = () => navigate("/store");

  const filteredTransactions =
    filter === "All"
      ? wallet?.transactions || []
      : wallet?.transactions?.filter((t) => t.type === filter.toLowerCase());

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg">
        Please log in to view your wallet.
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg animate-pulse">
        Loading wallet details...
      </div>
    );

  if (!wallet)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Could not load wallet data.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* 💰 Header */}
        <h2 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          My Wallet 💰
        </h2>

        {/* 🪙 Wallet Summary */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <p className="text-lg text-gray-800 dark:text-gray-200 mb-2">
            Hello,{" "}
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              {wallet.user.name}
            </span>
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-4xl font-extrabold text-yellow-500 drop-shadow-sm">
              {wallet.user.coins} 🪙
            </p>
            <button
              onClick={handleRedeem}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              🛍️ Redeem in Store
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Earn more coins by participating in weekly quizzes!
          </p>
        </div>

        {/* 🔎 Filter Tabs */}
        <div className="flex justify-center space-x-3 mb-6">
          {["All", "Earn", "Spend"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                filter === tab
                  ? "bg-teal-600 text-white shadow-md scale-105"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-500 hover:text-white"
              }`}
            >
              {tab === "Earn" ? "🟢 Earned" : tab === "Spend" ? "🟡 Spent" : "✨ All"}
            </button>
          ))}
        </div>

        {/* 📜 Transaction History */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-lg transition-all duration-300">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center">
            Transaction History
          </h3>

          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No {filter !== "All" ? filter.toLowerCase() : ""} transactions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((t, index) => (
                <div
                  key={t._id}
                  className={`p-5 rounded-xl shadow-sm border-l-4 transition-all duration-300 ${
                    t.type === "earn"
                      ? "bg-green-50 dark:bg-green-900/30 border-green-500 hover:shadow-md"
                      : "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 hover:shadow-md"
                  } animate-fade-in`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between flex-wrap gap-3 items-center">
                    <div>
                      <p className="font-semibold capitalize text-gray-800 dark:text-gray-200">
                        {t.type === "earn" ? "Earned" : "Spent"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          t.type === "earn"
                            ? "text-green-600 dark:text-green-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {t.type === "earn" ? "+" : "-"}
                        {t.amount} 🪙
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(t.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Wallet;
