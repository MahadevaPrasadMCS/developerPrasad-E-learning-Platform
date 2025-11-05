import React, { useEffect, useState } from "react";
import api from "../utils/api";
import axios from "axios";
import { saveAs } from "file-saver";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Store() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(0);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Fetch store items + wallet
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resResources, resWallet] = await Promise.all([
          api.get("/store"),
          token
            ? api.get("/wallet", {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
        ]);

        setResources(resResources.data || []);
        if (resWallet?.data?.user) {
          setWallet(resWallet.data.user.coins || 0);
        }
      } catch (err) {
        console.error("Store load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  // Redeem resource and download file
  const handleRedeem = async (resource) => {
    if (!token) {
      alert("Please log in to redeem resources.");
      navigate("/login");
      return;
    }

    if (wallet < resource.coinsRequired) {
      alert("Not enough coins. Earn more by playing quizzes.");
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

      // Redeem resource
      const res = await api.post(
        "/store/redeem",
        { resourceId: resource._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message || "Purchased successfully!");
      setWallet(res.data.newBalance);

      // Download securely
      const downloadUrl = `http://localhost:5000/api/store/download/${encodeURIComponent(
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
      console.error("Redeem error:", err);
      alert(err.response?.data?.message || "Purchase or download failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading store...
      </div>
    );

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
              {wallet} 🪙
            </p>
          </div>
        </div>

        {/* Store Grid */}
        {resources.length === 0 ? (
          <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-16 rounded-2xl shadow-md">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No resources available yet.
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

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 min-h-[48px]">
                  {r.description || "No description available."}
                </p>

                <div className="flex justify-between items-center mb-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cost:
                  </p>
                  <span className="font-semibold text-yellow-500">
                    {r.coinsRequired} 🪙
                  </span>
                </div>

                <button
                  onClick={() => handleRedeem(r)}
                  disabled={processingId === r._id || wallet < r.coinsRequired}
                  className={`w-full py-2 rounded-lg font-medium shadow transition-all duration-200 ${
                    wallet >= r.coinsRequired
                      ? "bg-teal-500 hover:bg-teal-600 text-white"
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
