import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function Wallet() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");

  const limit = 8;

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/wallet?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(res.data.transactions);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Wallet fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchWallet();
  }, [token, page]);

  const exportCSV = () => {
    if (!wallet.length) return;

    const csv = [
      "Type,Amount,Description,Date",
      ...wallet.map(
        (t) =>
          `${t.type},${t.amount},${t.description || ""},${new Date(
            t.createdAt
          ).toLocaleString()}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wallet-transactions.csv";
    link.click();
  };

  const filtered = useMemo(() => {
    let records = [...wallet];

    if (filter !== "All")
      records = records.filter((t) => t.type === filter.toLowerCase());

    if (search.trim())
      records = records.filter(
        (t) =>
          t.description?.toLowerCase().includes(search.toLowerCase()) ||
          String(t.amount).includes(search)
      );

    if (sort === "amount-high")
      records.sort((a, b) => b.amount - a.amount);
    else if (sort === "amount-low")
      records.sort((a, b) => a.amount - b.amount);
    else
      records.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

    return records;
  }, [wallet, filter, search, sort]);

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-100 py-10 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <h2 className="text-4xl font-bold text-center text-teal-600 dark:text-teal-400">
          Wallet
        </h2>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 flex justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">
              {user.name}
            </p>
            <p className="text-3xl font-bold text-yellow-500">
              {user.coins} 🪙
            </p>
          </div>

          <button
            onClick={() => navigate("/store")}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 rounded text-white shadow"
          >
            Redeem Items
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border dark:bg-gray-700 text-sm"
          >
            <option>All</option>
            <option>Earn</option>
            <option>Spend</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-lg border dark:bg-gray-700 text-sm"
          >
            <option value="recent">Newest First</option>
            <option value="amount-high">Amount: High → Low</option>
            <option value="amount-low">Amount: Low → High</option>
          </select>

          <input
            placeholder="Search description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border dark:bg-gray-700 text-sm w-32 sm:w-48"
          />

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow text-sm"
          >
            Export CSV
          </button>
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-14 bg-gray-200 dark:bg-gray-700 rounded mb-4"
              />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No Records Found
            </div>
          ) : (
            filtered.map((t, i) => (
              <div
                key={i}
                className={`flex justify-between items-center p-4 rounded border-l-4 mb-3 ${
                  t.type === "earn"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-red-500 bg-red-50 dark:bg-red-900/20"
                }`}
              >
                <div>
                  <p className="font-semibold capitalize">
                    {t.type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t.description}
                  </p>
                </div>

                <p
                  className={`${t.type === "earn"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                    } font-bold text-lg`}
                >
                  {t.type === "earn" ? "+" : "-"}
                  {t.amount}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}

export default Wallet;
