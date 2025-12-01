// client/src/components/DemotionModal.jsx
import { useState } from "react";
import { ShieldAlert, Check, X, Loader2 } from "lucide-react";
import api from "../utils/api";

export default function DemotionModal({ request, onClose, onUpdated }) {
  const [disputeText, setDisputeText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const status = request.status;
  const current = request.currentRole;
  const next = request.newRole;

  const handleRespond = async (confirm) => {
    setLoading(true);
    try {
      await api.patch(`/role-change/${request._id}/respond`, {
        confirm,
        disputeNote: confirm ? undefined : disputeText.trim(),
      });
      onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const disableActions = ["USER_ACCEPTED", "USER_DISPUTED"].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Role Change Notice
          </h2>
        </div>

        {/* Reason */}
        <p className="text-sm text-slate-700 dark:text-slate-300">
          The management has requested to change your role from:
        </p>

        {/* Role view */}
        <div className="mt-3 flex gap-2 items-center flex-wrap">
          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {current}
          </span>
          <span className="text-rose-500 font-bold">→</span>
          <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200">
            {next}
          </span>
        </div>

        {/* CEO Reason */}
        {request.reason && (
          <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">
              Why this change:
            </p>
            {request.reason}
          </div>
        )}

        {/* Disputed note */}
        {status === "USER_DISPUTED" && (
          <div className="mt-4 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg text-sm text-amber-700 dark:text-amber-200">
            <span className="font-semibold">Your response:</span> {request.disputeNote}
          </div>
        )}

        {/* Dispute input box */}
        {status === "PENDING_USER_REVIEW" && (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Dispute reason (if you disagree)
            </label>
            <textarea
              className="w-full mt-1 text-sm rounded-lg p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none"
              rows={3}
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
            />
          </div>
        )}

        {/* Waiting View */}
        {status === "USER_ACCEPTED" && (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Your acknowledgment has been recorded. Please wait for final approval.
          </p>
        )}

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          {status === "PENDING_USER_REVIEW" && (
            <>
              <button
                disabled={loading}
                onClick={() => handleRespond(false)}
                className="px-4 py-2 text-sm rounded-lg text-rose-600 dark:text-rose-300 border border-rose-600 dark:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                Submit Dispute
              </button>

              <button
                disabled={loading}
                onClick={() => handleRespond(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Accept Change
              </button>
            </>
          )}

          {(status === "USER_ACCEPTED" || status === "USER_DISPUTED") && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
