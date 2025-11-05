import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Wallet() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .get("/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setWallet(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRedeem = () => {
    navigate("/store");
  };

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
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <h2 className="text-4xl font-extrabold text-center text-teal-600 dark:text-teal-400">
          My Wallet 💰
        </h2>

        {/* Wallet Summary */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <p className="text-lg text-gray-800 dark:text-gray-200 mb-2">
            Hello, <span className="font-semibold">{wallet.user.name}</span>
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-3xl font-bold text-yellow-500 drop-shadow-sm animate-pulse">
              {wallet.user.coins} 🪙
            </p>
            <button
              onClick={handleRedeem}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow transition"
            >
              🛍️ Redeem in Store
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Earn more coins by participating in quizzes every week!
          </p>
        </div>

        {/* Transaction History */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-lg transition-all duration-300">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center">
            Transaction History
          </h3>

          {wallet.transactions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No transactions yet. Start earning coins!
            </p>
          ) : (
            <div className="space-y-4">
              {wallet.transactions.map((t, index) => (
                <div
                  key={t._id}
                  className={`p-5 rounded-xl shadow-sm border-l-4 transition-all duration-300 ${
                    t.type === "earn"
                      ? "bg-green-50 dark:bg-green-900/40 border-green-500 hover:shadow-md"
                      : "bg-yellow-50 dark:bg-yellow-900/40 border-yellow-500 hover:shadow-md"
                  } animate-fade-in`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between flex-wrap gap-2">
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
                        className={`text-lg font-semibold ${
                          t.type === "earn"
                            ? "text-green-600 dark:text-green-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {t.type === "earn" ? "+" : "-"}
                        {t.amount} 🪙
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(t.createdAt).toLocaleDateString()}
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
