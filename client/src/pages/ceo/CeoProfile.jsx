import React, { useEffect, useRef, useState } from "react";
import { Loader2, Edit2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import ProfileAvatar from "../../components/ProfileAvatar";

export default function CeoProfile() {
  const { user, updateUserFromServer } = useAuth();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [oldAvatarPath, setOldAvatarPath] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const bucket = process.env.REACT_APP_SUPABASE_BUCKET || "avatars";

  const extractPath = (url) =>
    url?.split(`/object/public/${bucket}/`)[1] || null;

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await api.get("/auth/me");
        setName(res.data?.name || "");
        setBio(res.data?.bio || "");
        setAvatarUrl(res.data?.avatarUrl || null);
        setOldAvatarPath(extractPath(res.data?.avatarUrl));
      } catch {
        toast.error("Failed to load profile");
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);

    const newPath = `ceo/${user.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const uploadToast = toast.loading("Uploading...");

    try {
      if (oldAvatarPath)
        await supabase.storage.from(bucket).remove([oldAvatarPath]);

      const { error } = await supabase.storage
        .from(bucket)
        .upload(newPath, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(newPath);
      const url = data.publicUrl;

      await api.patch("/auth/update-avatar", { avatarUrl: url });

      setAvatarUrl(url);
      setOldAvatarPath(newPath);
      setLocalPreview(null);

      await updateUserFromServer();
      toast.success("Updated!");
    } catch {
      toast.error("Failed upload");
      setLocalPreview(null);
    }
    toast.dismiss(uploadToast);
    e.target.value = "";
  };

  const deleteAvatar = async () => {
    if (!avatarUrl) return;
    await api.patch("/auth/update-avatar", { avatarUrl: null });
    setAvatarUrl(null);
    setLocalPreview(null);
    await updateUserFromServer();
    toast.success("Removed");
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name required!");
    setSaving(true);
    await api.patch("/auth/update", {
      name: name.trim(),
      bio: bio?.trim() || ""
    });

    await updateUserFromServer();
    setSaving(false);
    setEditing(false);
    toast.success("Saved!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold dark:text-white">Profile</h2>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black"
          >
            <Edit2 size={14} /> Edit
          </button>
        ) : (
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600"
          >
            <X size={14} /> Cancel
          </button>
        )}
      </div>

      {/* Avatar */}
      <ProfileAvatar
        avatarUrl={avatarUrl}
        localPreview={localPreview}
        editing={editing}
        onPick={() => fileInputRef.current.click()}
        onDelete={deleteAvatar}
        fileInputRef={fileInputRef}
        setShowPreview={setShowPreview}
        name={name}
      />

      {/* Profile Preview Modal */}
      {showPreview && avatarUrl && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <img
            src={avatarUrl}
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-xl object-contain"
          />
        </div>
      )}

      {/* Information */}
      {editing ? (
        <div className="space-y-4">
          <input
            className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
          />

          <textarea
            rows={3}
            className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:text-white"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Your bio..."
          />
        </div>
      ) : (
        <div className="space-y-2 dark:text-gray-300">
          <p className="font-semibold text-lg">{name}</p>
          <p>{bio || "No bio added"}</p>
        </div>
      )}

      {/* Save Button */}
      {editing && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 flex gap-2 items-center"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}
    </div>
  );
}
