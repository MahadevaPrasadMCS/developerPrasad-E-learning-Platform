import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../utils/api";
import axios from "axios";
import { saveAs } from "file-saver";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Store() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(0);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  // ✅ Memoized headers
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  // ✅ Fetch resources and wallet in parallel
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resResources, resWallet] = await Promise.all([
        api.get("/store"),
        token ? api.get("/wallet", { headers: authHeaders }) : Promise.resolve(null),
      ]);

      setResources(resResources.data || []);
      if (resWallet?.data?.user) setWallet(resWallet.data.user.coins || 0);
    } catch (err) {
      console.error("❌ Error loading store:", err);
      setError("Failed to load resources. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ✅ Redeem & Download handler
  const handleRedeem = async (resource) => {
    if (!token) {
      alert("Please log in to redeem resources.");
      navigate("/login");
      return;
    }

    if (wallet < resource.coinsRequired) {
      alert("Not enough coins. Earn more by taking quizzes.");
      return;
    }

    if (
      !window.confirm(
        `Spend ${resource.coinsRequired} coins to unlock "${resource.title}"?`
      )
    )
      return;

    try {
      setProcessingId(resource._id);

      // Redeem the resource
      const res = await api.post(
        "/store/redeem",
        { resourceId: resource._id },
        { headers: authHeaders }
      );

      alert(res.data.message || "Redeemed successfully!");
      setWallet(res.data.newBalance);

      // Determine backend URL dynamically
      const baseURL =
        window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : "https://youlearnhub-backend.onrender.com";

      // Secure file download
      const downloadUrl = `${baseURL}/api/store/download/${encodeURIComponent(
        resource.fileName
      )}?token=${encodeURIComponent(token)}`;

      const downloadRes = await axios.get(downloadUrl, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-access-token": token,
        },
      });

      const blob = new Blob([downloadRes.data], {
        type: downloadRes.headers["content-type"] || "application/pdf",
      });

      const ext = resource.fileName.split(".").pop();
      saveAs(blob, `${resource.title}.${ext}`);
    } catch (err) {
      console.error("Redeem/download error:", err);
      alert(err.response?.data?.message || "Purchase or download failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Loading State
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading store...
      </div>
    );

  // ✅ Error State
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-8 py-5 rounded-xl shadow-lg text-center">
          {error}
        </div>
      </div>
    );

  // ✅ Main Store UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10">
          <h2 className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 mb-4 sm:mb-0">
            Learning Store 🛍️
          </h2>
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available Coins
            </p>
            <p className="text-3xl font-bold text-yellow-500 drop-shadow-sm">
              {wallet.toLocaleString()} 🪙
            </p>
          </div>
        </div>

        {/* Resources */}
        {resources.length === 0 ? (
          <div className="text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              No resources available yet.
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Check back soon for new study materials!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((r, index) => (
              <div
                key={r._id}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Title & Type */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {r.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-md font-medium ${
                      r.type === "video"
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    }`}
                  >
                    {r.type.toUpperCase()}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 min-h-[48px] leading-relaxed">
                  {r.description || "No description provided."}
                </p>

                {/* Cost */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cost:
                  </p>
                  <span className="font-semibold text-yellow-500">
                    {r.coinsRequired} 🪙
                  </span>
                </div>

                {/* Redeem Button */}
                <button
                  onClick={() => handleRedeem(r)}
                  disabled={processingId === r._id || wallet < r.coinsRequired}
                  className={`w-full py-2.5 rounded-lg font-medium shadow-md transition-all duration-200 ${
                    wallet >= r.coinsRequired
                      ? "bg-teal-600 hover:bg-teal-700 text-white hover:shadow-lg"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {processingId === r._id
                    ? "Processing..."
                    : wallet >= r.coinsRequired
                    ? "Redeem & Download"
                    : "Insufficient Coins"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Store;
