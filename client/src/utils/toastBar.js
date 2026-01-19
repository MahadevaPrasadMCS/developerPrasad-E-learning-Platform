import { toast } from "react-hot-toast";

export const toastWithBar = (message, type = "success", duration = 4000) => {
  toast.custom((t) => (
    <div
      className={`relative overflow-hidden rounded-lg px-4 py-3 shadow-lg
      ${type === "error" ? "bg-red-600" : "bg-emerald-600"} text-white`}
    >
      <p className="text-sm font-medium">{message}</p>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-white/80"
        style={{
          width: "100%",
          animation: `shrink ${duration}ms linear forwards`,
        }}
      />

      <style>
        {`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </div>
  ), { duration });
};
