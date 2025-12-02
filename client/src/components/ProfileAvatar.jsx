import React from "react";
import { Camera, Trash2 } from "lucide-react";

export default function ProfileAvatar({
  avatarUrl,
  localPreview,
  editing,
  onDelete,
  fileInputRef,
  setShowPreview,
  name
}) {
  const displayUrl = localPreview || avatarUrl;

  const handleAvatarClick = () => {
    if (editing) {
      fileInputRef.current?.click(); // <-- Direct user action = Allowed
    } else {
      setShowPreview(true);
    }
  };

  return (
    <div className="relative w-28 h-28">
      <div
        onClick={handleAvatarClick}
        className={`w-full h-full rounded-full overflow-hidden shadow-md 
          bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer
          ${editing && "ring-4 ring-emerald-500 ring-offset-2"}
        `}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover transition-all hover:scale-105 duration-150"
          />
        ) : (
          <span className="text-3xl font-semibold text-gray-700 dark:text-gray-100">
            {name?.[0]?.toUpperCase() || "C"}
          </span>
        )}
      </div>

      {/* Upload Input */}
      <input
        type="file"
        hidden
        accept="image/*"
        ref={fileInputRef}
        // Directly handled in parent (handleAvatarSelect)
      />

      {/* Delete Button */}
      {editing && avatarUrl && (
        <button
          onClick={onDelete}
          className="absolute -right-2 -top-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Camera Button (Optional visual cue) */}
      {editing && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-1 right-1 bg-black/80 text-white p-2 rounded-full hover:bg-black"
        >
          <Camera size={16} />
        </button>
      )}
    </div>
  );
}
