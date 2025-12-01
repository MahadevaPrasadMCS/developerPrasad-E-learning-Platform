import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { currencyFormatter } from "../../utils/formatters"; // optional if you want helpers

export default function WalletCEO() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState("credit"); // credit or debit
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [refreshToggle, setRefreshToggle] = useState(false);

  // Load all user wallet data
  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, txRes] = await Promise.all([
        api.get("/ceo/wallet/users"),
        api.get("/ceo/wallet/transactions"),
      ]);
      setUsers(userRes.data || []);
      setTransactions(txRes.data || []);
    } catch (error) {
      console.error("Failed to load wallet CEO data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshToggle]);

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setAmount("");
    setDescription("");
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  const submitChange = async () => {
    if (!amount || Number(amount) <= 0) return;
    try {
      setModalLoading(true);
      const payload = {
        userId: selectedUser._id,
        amount: Number(amount),
        description,
      };
      const endpoint = modalType === "credit" ? "/ceo/wallet/credit" : "/ceo/wallet/debit";
      await api.post(endpoint, payload);
      setModalLoading(false);
      closeModal();
      setRefreshToggle((prev) => !prev);
    } catch (error) {
      console.error("Transaction failed:", error);
      setModalLoading(false);
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  return (
    <div className="p-6 space-y-10">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">CEO Wallet System</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage coin distribution, rewards, and system-wide audit.
        </p>
      </div>

      {/* Wallet Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Users" value={users.length} />
        <StatCard
          label="Total Coins in System"
          value={users.reduce((a, b) => a + (b.coins || 0), 0)}
        />
        <StatCard label="Transactions Logged" value={transactions.length} />
      </section>

      {/* Wallet Users Table */}
      <section>
        <h3 className="text-lg font-semibold mb-3">User Wallets</h3>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-right">Coins</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">{u.coins}</td>
                    <td className="py-3 px-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => openModal(u, "credit")}
                        className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
                      >
                        Credit
                      </button>
                      <button
                        onClick={() => openModal(u, "debit")}
                        className="px-3 py-1 text-xs bg-rose-500 hover:bg-rose-600 text-white rounded-md"
                      >
                        Debit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transactions Table */}
      <section>
        <h3 className="text-lg font-semibold mb-3">All Transactions</h3>

        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Action By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-left">Description</th>
                <th className="py-3 px-4 text-left">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-sm">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="py-3 px-4">{t.user?.name}</td>
                    <td className="py-3 px-4">{t.performedBy?.name}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        t.type === "credit"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {t.type === "credit" ? "+" : "-"}
                      {t.amount}
                    </td>
                    <td className="py-3 px-4 max-w-[220px] truncate">
                      {t.description}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-lg font-bold mb-4">
                {modalType === "credit" ? "Credit Coins To" : "Debit Coins From"}{" "}
                {selectedUser.name}
              </h3>

              <div className="space-y-3 mb-5">
                <label className="text-sm">Amount</label>
                <input
                  required
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <label className="text-sm">Description</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600"
                  placeholder="Why this change?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md border dark:border-gray-700"
                >
                  Cancel
                </button>

                <button
                  onClick={submitChange}
                  disabled={modalLoading}
                  className={`px-4 py-2 rounded-md text-white ${
                    modalType === "credit"
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {modalLoading
                    ? "Processing..."
                    : modalType === "credit"
                    ? "Confirm Credit"
                    : "Confirm Debit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* STAT CARD COMPONENT */
function StatCard({ label, value }) {
  return (
    <div className="p-5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1 text-emerald-500">{value}</p>
    </div>
  );
}
