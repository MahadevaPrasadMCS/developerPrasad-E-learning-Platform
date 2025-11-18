// src/pages/admin/AdminProfileRequests.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  Loader2,
  CheckCircle,
  XCircle,
  UserCog,
} from "lucide-react";

function AdminProfileRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingReject, setProcessingReject] = useState(false);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/profile-change-requests", {
        headers: { "X-Auth-Role": "admin" },
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load profile change requests:", err);
      showToast("❌ Failed to load profile change requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchRequests();
  }, [user]);

  const approveRequest = async (id) => {
    try {
      const res = await api.patch(
        `/users/profile-change-requests/${id}/approve`,
        {},
        { headers: { "X-Auth-Role": "admin" } }
      );
      showToast(
        res.data?.message || "✅ Profile updated successfully!",
        "success"
      );
      fetchRequests();
    } catch (err) {
      console.error("Failed to approve profile change request:", err);
      showToast("❌ Failed to approve request.", "error");
    }
  };

  const openRejectModal = (req) => {
    setRejectTarget(req);
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason.", "error");
      return;
    }

    try {
      setProcessingReject(true);
      await api.patch(
        `/users/profile-change-requests/${rejectTarget._id}/reject`,
        { reason: rejectReason.trim() },
        { headers: { "X-Auth-Role": "admin" } }
      );
      showToast("Request rejected.", "success");
      setRejectTarget(null);
      setRejectReason("");
      fetchRequests();
    } catch (err) {
      console.error("Failed to reject:", err);
      showToast("❌ Failed to reject request.", "error");
    } finally {
      setProcessingReject(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-red-500 font-semibold">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">
              ❌ Reject Profile Change
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Provide a reason for rejecting the request from{" "}
              <span className="font-semibold">
                {rejectTarget.user?.name}
              </span>
              .
            </p>
            <textarea
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none outline-none border border-gray-200 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-400"
              placeholder="Reason for rejection..."
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={processingReject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {processingReject && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <UserCog className="text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            Profile Change Requests
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No profile change requests found.
          </p>
        ) : (
          <div className="space-y-5">
            {requests.map((req, index) => (
              <div
                key={req._id}
                className="rounded-2xl p-5 border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {req.user?.name}{" "}
                      <span className="text-gray-500">
                        ({req.user?.email})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Requested:{" "}
                      {req.requestedAt
                        ? new Date(
                            req.requestedAt
                          ).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold text-center ${
                      req.status === "pending"
                        ? "bg-yellow-400 text-black"
                        : req.status === "approved"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <ul className="mt-3 text-sm space-y-1">
                  {req.fields.map((f, i) => (
                    <li key={i}>
                      <strong className="uppercase text-gray-700 dark:text-gray-200">
                        {f.field}:
                      </strong>{" "}
                      <span className="text-gray-500 line-through">
                        {f.oldValue}
                      </span>{" "}
                      <span className="mx-1">→</span>
                      <span className="text-indigo-600 dark:text-indigo-300">
                        {f.newValue}
                      </span>
                    </li>
                  ))}
                </ul>

                {req.status === "rejected" && req.rejectionReason && (
                  <p className="mt-2 text-xs text-red-500">
                    Rejected reason: {req.rejectionReason}
                  </p>
                )}

                {req.status === "pending" && (
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => approveRequest(req._id)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(req)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}

                {req.status !== "pending" && req.resolvedAt && (
                  <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 text-right">
                    Resolved:{" "}
                    {new Date(req.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProfileRequests;
