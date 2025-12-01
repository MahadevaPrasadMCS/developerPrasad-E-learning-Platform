import React from "react";
import { Camera, Trash2 } from "lucide-react";

export default function ProfileAvatar({
  avatarUrl,
  localPreview,
  editing,
  onPick,
  onDelete,
  fileInputRef,
  setShowPreview,
  name
}) {
  const displayUrl = localPreview || avatarUrl;

  return (
    <div className="relative w-28 h-28">
      <div
        className={`w-full h-full rounded-full overflow-hidden shadow-md 
          bg-gray-200 dark:bg-gray-700 flex items-center justify-center
          ${editing && "ring-4 ring-emerald-500 ring-offset-2"}
        `}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            onClick={() => !editing && setShowPreview(true)}
            className={`w-full h-full object-cover transition-all
              ${!editing && "cursor-pointer hover:scale-105 duration-150"}
            `}
          />
        ) : (
          <span className="text-3xl font-semibold text-gray-700 dark:text-gray-100">
            {name?.[0]?.toUpperCase() || "C"}
          </span>
        )}
      </div>

      {/* Upload */}
      {editing && (
        <>
          <button
            onClick={onPick}
            className="absolute bottom-1 right-1 bg-black/80 text-white p-2 rounded-full hover:bg-black"
          >
            <Camera size={16} />
          </button>
          <input
            type="file"
            hidden
            accept="image/*"
            ref={fileInputRef}
            onChange={onPick}
          />
        </>
      )}

      {/* Delete */}
      {editing && avatarUrl && (
        <button
          onClick={onDelete}
          className="absolute -right-2 -top-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
