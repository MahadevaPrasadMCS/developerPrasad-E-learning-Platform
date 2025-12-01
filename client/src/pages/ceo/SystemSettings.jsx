// pages/ceo/SystemSettings.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Loader2,
  AlertTriangle,
  Upload,
  Mail,
  Bell,
  Home,
  Settings2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../utils/supabaseClient";

const TABS = [
  { id: "branding", label: "Branding", icon: Settings2 },
  { id: "availability", label: "Availability", icon: AlertTriangle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "homepage", label: "Homepage", icon: Home },
  { id: "email", label: "Email", icon: Mail },
];

export default function SystemSettings() {
  const { user } = useAuth();
  const isCeo = user?.role === "ceo";

  // Core state
  const [activeTab, setActiveTab] = useState("branding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Branding
  const [platformName, setPlatformName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [oldLogoPath, setOldLogoPath] = useState(null);

  // Availability
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "We are under scheduled maintenance. Please try again later."
  );
  const [allowRegistrations, setAllowRegistrations] = useState(true);

  // Notifications
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Homepage
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [oldHeroImagePath, setOldHeroImagePath] = useState(null);

  // Email
  const [emailTarget, setEmailTarget] = useState("ADMINS_TEACHERS");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const logoInputRef = useRef(null);
  const heroImageInputRef = useRef(null);

  const bucket = process.env.REACT_APP_SUPABASE_BUCKET || "avatars";

  const extractPath = (url) =>
    url?.split(`/object/public/${bucket}/`)[1] || null;

  // Load system settings once
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.get("/system/settings");

        const data = res.data || {};

        setPlatformName(data.platformName || "YouLearnHub");
        setLogoUrl(data.logoUrl || "");
        setOldLogoPath(extractPath(data.logoUrl));

        setMaintenanceMode(!!data.maintenanceMode);
        setMaintenanceMessage(
          data.maintenanceMessage ||
            "We are under scheduled maintenance. Please try again later."
        );
        setAllowRegistrations(
          data.allowRegistrations === undefined
            ? true
            : !!data.allowRegistrations
        );

        setNotificationEnabled(!!data.globalNotification?.enabled);
        setNotificationMessage(data.globalNotification?.message || "");

        setHeroTitle(data.homepageBanner?.title || "");
        setHeroSubtitle(data.homepageBanner?.subtitle || "");
        setHeroImageUrl(data.homepageBanner?.imageUrl || "");
        setOldHeroImagePath(extractPath(data.homepageBanner?.imageUrl));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load system settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Generic Supabase upload helper
  const uploadToSupabase = async (file, pathPrefix, oldPathSetter) => {
    const ext = file.name.split(".").pop();
    const newPath = `${pathPrefix}/${Date.now()}.${ext}`;

    // Delete old file if exists
    const oldPath =
      oldPathSetter === setOldLogoPath ? oldLogoPath : oldHeroImagePath;
    if (oldPath) {
      await supabase.storage.from(bucket).remove([oldPath]);
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(newPath, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(newPath);
    const url = data?.publicUrl;
    if (!url) throw new Error("Failed to get public URL");

    oldPathSetter(newPath);
    return url;
  };

  // Branding: logo upload
  const handleLogoSelect = async (e) => {
    if (!isCeo) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max logo size is 2MB");
      return;
    }

    const toastId = toast.loading("Uploading logo...");
    try {
      const url = await uploadToSupabase(file, "branding/logo", setOldLogoPath);
      setLogoUrl(url);
      toast.success("Logo uploaded. Don’t forget to save.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload logo");
    } finally {
      toast.dismiss(toastId);
      e.target.value = "";
    }
  };

  // Homepage: hero image upload
  const handleHeroImageSelect = async (e) => {
    if (!isCeo) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const toastId = toast.loading("Uploading banner...");
    try {
      const url = await uploadToSupabase(
        file,
        "branding/homepage",
        setOldHeroImagePath
      );
      setHeroImageUrl(url);
      toast.success("Banner uploaded. Don’t forget to save.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload banner");
    } finally {
      toast.dismiss(toastId);
      e.target.value = "";
    }
  };

  // Save handlers per tab
  const saveBranding = async () => {
    if (!isCeo) return;
    if (!platformName.trim()) {
      toast.error("Platform name cannot be empty");
      return;
    }

    try {
      setSaving(true);
      await api.patch("/system/settings/brand", {
        platformName: platformName.trim(),
        logoUrl: logoUrl || null,
      });
      toast.success("Branding settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const saveAvailability = async () => {
    if (!isCeo) return;
    try {
      setSaving(true);
      await api.patch("/system/settings/availability", {
        maintenanceMode,
        maintenanceMessage,
        allowRegistrations,
      });
      toast.success("Availability settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    if (!isCeo) return;
    try {
      setSaving(true);
      await api.patch("/system/settings/notification", {
        enabled: notificationEnabled,
        message: notificationMessage,
      });
      toast.success("Notification settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save notifications");
    } finally {
      setSaving(false);
    }
  };

  const saveHomepage = async () => {
    if (!isCeo) return;
    try {
      setSaving(true);
      await api.patch("/system/settings/homepage", {
        title: heroTitle,
        subtitle: heroSubtitle,
        imageUrl: heroImageUrl || null,
      });
      toast.success("Homepage settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save homepage");
    } finally {
      setSaving(false);
    }
  };

  const sendEmail = async () => {
    if (!isCeo) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Subject and body are required");
      return;
    }

    try {
      setSaving(true);
      await api.post("/system/settings/email", {
        target: emailTarget,
        subject: emailSubject.trim(),
        body: emailBody.trim(),
      });
      toast.success("Email sent successfully");
      setEmailSubject("");
      setEmailBody("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send email");
    } finally {
      setSaving(false);
    }
  };

  // Tab Content Renderers
  const renderBrandingTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Platform Name
        </label>
        <input
          disabled={!isCeo}
          value={platformName}
          onChange={(e) => setPlatformName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
          placeholder="Enter platform name"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Logo
        </p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                No logo
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => isCeo && logoInputRef.current?.click()}
              disabled={!isCeo}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed
                         border-gray-400 text-sm text-gray-700 dark:text-gray-200
                         disabled:opacity-60"
            >
              <Upload size={16} />
              {logoUrl ? "Change Logo" : "Upload Logo"}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              PNG/JPEG, max 2MB. Stored in Supabase.
            </p>
            <input
              type="file"
              ref={logoInputRef}
              hidden
              accept="image/*"
              onChange={handleLogoSelect}
            />
          </div>
        </div>
      </div>

      {isCeo && (
        <button
          onClick={saveBranding}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save Branding
        </button>
      )}
    </div>
  );

  const renderAvailabilityTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            Maintenance Mode
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            When enabled, all users except CEO & Admin are logged out and see a
            maintenance page with the message below.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {maintenanceMode ? "Enabled" : "Disabled"}
          </span>
          <input
            type="checkbox"
            disabled={!isCeo}
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Maintenance Message
        </label>
        <textarea
          disabled={!isCeo}
          rows={3}
          value={maintenanceMessage}
          onChange={(e) => setMaintenanceMessage(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            Allow New Registrations
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Turn this off when server is under heavy load or during controlled
            access phase.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {allowRegistrations ? "Allowed" : "Blocked"}
          </span>
          <input
            type="checkbox"
            disabled={!isCeo}
            checked={allowRegistrations}
            onChange={(e) => setAllowRegistrations(e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>

      {isCeo && (
        <button
          onClick={saveAvailability}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save Availability
        </button>
      )}
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Global notifications are shown to all roles except <b>Students</b>.
      </p>

      <div className="flex items-center justify-between">
        <p className="font-medium text-gray-800 dark:text-gray-100">
          Enable Global Notification
        </p>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {notificationEnabled ? "Enabled" : "Disabled"}
          </span>
          <input
            type="checkbox"
            disabled={!isCeo}
            checked={notificationEnabled}
            onChange={(e) => setNotificationEnabled(e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Notification Message
        </label>
        <textarea
          disabled={!isCeo}
          rows={3}
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
          placeholder="Enter message shown at the top of dashboards..."
        />
      </div>

      {isCeo && (
        <button
          onClick={saveNotifications}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save Notifications
        </button>
      )}
    </div>
  );

  const renderHomepageTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Hero Title
        </label>
        <input
          disabled={!isCeo}
          value={heroTitle}
          onChange={(e) => setHeroTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
          placeholder="Example: Learn Anything, Anytime"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Hero Subtitle
        </label>
        <textarea
          disabled={!isCeo}
          rows={3}
          value={heroSubtitle}
          onChange={(e) => setHeroSubtitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
          placeholder="Short description for the homepage hero section..."
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Hero Banner Image
        </p>
        <div className="flex items-center gap-4">
          <div className="w-40 h-24 rounded-lg border bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt="Hero"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                No image
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => isCeo && heroImageInputRef.current?.click()}
              disabled={!isCeo}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed
                         border-gray-400 text-sm text-gray-700 dark:text-gray-200
                         disabled:opacity-60"
            >
              <Upload size={16} />
              {heroImageUrl ? "Change Banner" : "Upload Banner"}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Landscape image recommended. Stored in Supabase.
            </p>
            <input
              type="file"
              ref={heroImageInputRef}
              hidden
              accept="image/*"
              onChange={handleHeroImageSelect}
            />
          </div>
        </div>
      </div>

      {isCeo && (
        <button
          onClick={saveHomepage}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save Homepage
        </button>
      )}
    </div>
  );

  const renderEmailTab = () => (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Send custom emails directly from CEO dashboard.{"  "}
        (Implementation: this should call backend which integrates with your
        email provider.)
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Recipients
        </label>
        <select
          disabled={!isCeo}
          value={emailTarget}
          onChange={(e) => setEmailTarget(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
        >
          <option value="ADMINS_TEACHERS">All Admins & Teachers</option>
          <option value="ADMINS_ONLY">Admins Only</option>
          <option value="TEACHERS_ONLY">Teachers Only</option>
          <option value="ALL_NON_STUDENTS">All Non-Student Users</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Subject
        </label>
        <input
          disabled={!isCeo}
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
          placeholder="Email subject"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Message
        </label>
        <textarea
          disabled={!isCeo}
          rows={6}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
          placeholder="Write your message..."
        />
      </div>

      {isCeo && (
        <button
          onClick={sendEmail}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Send Email
        </button>
      )}
    </div>
  );

  if (!isCeo) {
    return (
      <div className="p-6 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-500">
        <p className="font-semibold">Access Restricted</p>
        <p className="text-sm mt-1">
          Only the CEO can manage system-level settings. If you believe this is
          a mistake, contact the CEO.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            System Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage core platform configuration for all users.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-sm whitespace-nowrap
                ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin" size={18} />
            Loading settings...
          </div>
        ) : (
          <>
            {activeTab === "branding" && renderBrandingTab()}
            {activeTab === "availability" && renderAvailabilityTab()}
            {activeTab === "notifications" && renderNotificationsTab()}
            {activeTab === "homepage" && renderHomepageTab()}
            {activeTab === "email" && renderEmailTab()}
          </>
        )}
      </div>
    </div>
  );
}
