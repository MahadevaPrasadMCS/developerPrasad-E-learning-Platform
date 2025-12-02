import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Loader2,
  Edit2,
  X,
  Shield,
  Mail,
  UserCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import ProfileAvatar from "../../components/ProfileAvatar";

export default function CeoProfile() {
  const { user, updateUserFromServer } = useAuth();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [originalBio, setOriginalBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [oldAvatarPath, setOldAvatarPath] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);

  const isDirty = useMemo(
    () =>
      name.trim() !== originalName.trim() ||
      (bio || "").trim() !== (originalBio || "").trim(),
    [name, bio, originalName, originalBio]
  );

  useEffect(() => {
    let mounted = true;
    const bucket = process.env.REACT_APP_SUPABASE_BUCKET || "avatars";

    async function loadProfile() {
      const extractPathLocal = (url) =>
        url?.split(`/object/public/${bucket}/`)[1] || null;

      setLoading(true);
      try {
        const res = await api.get("/auth/me");
        if (!mounted) return;

        const fetchedName = res.data?.name || "";
        const fetchedBio = res.data?.bio || "";
        const fetchedAvatar = res.data?.avatarUrl || null;

        setName(fetchedName);
        setBio(fetchedBio);
        setOriginalName(fetchedName);
        setOriginalBio(fetchedBio);

        setAvatarUrl(fetchedAvatar);
        setOldAvatarPath(extractPathLocal(fetchedAvatar));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAvatarSelect = async (e) => {
    const bucket = process.env.REACT_APP_SUPABASE_BUCKET || "avatars";
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);

    const extension = file.name.split(".").pop();
    const newPath = `ceo/${user.id}-${Date.now()}.${extension}`;

    const uploadToast = toast.loading("Uploading avatar...");

    try {
      if (oldAvatarPath) {
        await supabase.storage.from(bucket).remove([oldAvatarPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(newPath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(newPath);
      const url = data.publicUrl;

      await api.patch("/auth/update-avatar", { avatarUrl: url });

      setAvatarUrl(url);
      setOldAvatarPath(newPath);
      setLocalPreview(null);

      await updateUserFromServer();
      toast.success("Avatar updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload avatar.");
      setLocalPreview(null);
    } finally {
      toast.dismiss(uploadToast);
      e.target.value = "";
    }
  };

  const deleteAvatar = async () => {
    const bucket = process.env.REACT_APP_SUPABASE_BUCKET || "avatars";
    if (!avatarUrl) return;

    const confirmDelete = window.confirm(
      "Remove your profile picture? This cannot be undone."
    );
    if (!confirmDelete) return;

    const deleteToast = toast.loading("Removing avatar...");
    try {
      await api.patch("/auth/update-avatar", { avatarUrl: null });

      if (oldAvatarPath) {
        await supabase.storage.from(bucket).remove([oldAvatarPath]);
      }

      setAvatarUrl(null);
      setLocalPreview(null);
      setOldAvatarPath(null);
      await updateUserFromServer();
      toast.success("Avatar removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove avatar.");
    } finally {
      toast.dismiss(deleteToast);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name is required.");

    if (!isDirty) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const saveToast = toast.loading("Saving changes...");

    try {
      await api.patch("/auth/update", {
        name: name.trim(),
        bio: bio?.trim() || "",
      });

      setOriginalName(name.trim());
      setOriginalBio(bio?.trim() || "");

      await updateUserFromServer();
      toast.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
      toast.dismiss(saveToast);
    }
  };

  const handleCancel = () => {
    setName(originalName);
    setBio(originalBio);
    setEditing(false);
  };

  const SkeletonLine = ({ className = "" }) => (
    <div
      className={`h-4 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse ${className}`}
    />
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold dark:text-white">
              Executive Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage how you appear across the platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {editing && isDirty && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200/60 dark:border-amber-700/50">
                Unsaved changes
              </span>
            )}

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3.5 py-1.5 text-sm font-medium transition-all hover:border-gray-900 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black"
              >
                <Edit2 size={14} />
                Edit profile
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              >
                <X size={14} />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
            <Shield size={14} />
            <span className="font-medium">{user?.role?.toUpperCase()}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800/60">
            <Mail size={14} />
            <span>{user?.email}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800/60">
            <UserCircle2 size={14} />
            <span>User ID: {user?.id?.slice(0, 8)}</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="flex-1 space-y-3">
                <SkeletonLine className="w-1/3" />
                <SkeletonLine className="w-2/3" />
              </div>
            </div>
            <div className="space-y-3">
              <SkeletonLine className="w-1/4" />
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-11/12" />
            </div>
          </div>
        ) : (
          <>
            <ProfileAvatar
              avatarUrl={avatarUrl}
              localPreview={localPreview}
              editing={editing}
              onPick={() => editing && fileInputRef.current?.click()}
              onDelete={editing ? deleteAvatar : undefined}
              fileInputRef={fileInputRef}
              setShowPreview={setShowPreview}
              name={name}
            />

            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleAvatarSelect}
            />

            {showPreview && (avatarUrl || localPreview) && (
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                onClick={() => setShowPreview(false)}
              >
                <img
                  src={localPreview || avatarUrl}
                  alt="Avatar preview"
                  className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl object-contain"
                />
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Full name
                </label>
                {editing ? (
                  <input
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/80 text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/80 focus:outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                ) : (
                  <p className="text-base font-medium dark:text-gray-100">
                    {name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Bio
                </label>
                {editing ? (
                  <textarea
                    rows={3}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/80 text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/80 focus:outline-none resize-none"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {bio || <span className="italic text-gray-400">No bio added yet.</span>}
                  </p>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
