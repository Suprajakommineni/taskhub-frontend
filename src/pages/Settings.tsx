import { useState, useEffect } from "react";
import DashboardLayout from "../Components/DashboardLayout";
import { useTheme } from "../Components/ThemeContext";
import { useAppData } from "../context/Appdatacontext";
import API from "../api/api";

import {
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Palette,
  Camera,
  Trash2,
  User as UserIcon,
} from "lucide-react";

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useAppData();

  // Profile photo
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [projectNotifications, setProjectNotifications] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // ── Load saved notification preferences on mount ──────────────────────
  useEffect(() => {
  API.get("/api/users/me/notification-preferences")
    .then((res) => {
      setEmailNotifications(res.data.emailNotifications   ?? true);
      setTaskNotifications(res.data.taskNotifications    ?? true);
      setProjectNotifications(res.data.projectNotifications ?? true);
    })
    .catch(console.error)
    .finally(() => setLoadingPrefs(false));
}, []);

  // ── Upload profile photo ────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await API.post("/api/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      window.dispatchEvent(new CustomEvent("dashboard-refresh"));
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
      setAvatarPreview("");
      e.target.value = "";
    }
  };

  // ── Remove profile photo ────────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    try {
      setRemovingAvatar(true);
      await API.post("/api/users/me/avatar/remove");
      setUser((prev) => ({ ...prev, avatarUrl: "" }));
      window.dispatchEvent(new CustomEvent("dashboard-refresh"));
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove photo.");
    } finally {
      setRemovingAvatar(false);
    }
  };

  // ── Save notification preferences ────────────────────────────────────
  const handleSaveSettings = async () => {
    try {
      setSavingPrefs(true);
      await API.put("/api/users/me/notification-preferences", {
        emailNotifications,
        taskNotifications,
        projectNotifications,
      });
      alert("Settings saved successfully.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }
    try {
      setSavingPassword(true);
      await API.put("/api/users/me/password", { currentPassword, newPassword });
      alert("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Unable to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Reusable toggle row ───────────────────────────────────────────────
  const ToggleRow = ({
    title,
    description,
    value,
    onChange,
    disabled,
  }: {
    title: string;
    description: string;
    value: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
          value ? "bg-[#0b46bc]" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
            value ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <DashboardLayout title="Settings" subtitle="Customize your TaskHub experience">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── PROFILE PHOTO ──────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-7">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-[#0b46bc]" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-900 dark:text-white">Profile Photo</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add or remove your profile picture.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            {avatarPreview || user.avatarUrl ? (
              <img
                src={avatarPreview || user.avatarUrl}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shrink-0">
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-600/25 transition-colors">
                <Camera className="w-4 h-4" />
                {uploadingAvatar ? "Uploading..." : "Change Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>

              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={removingAvatar}
                  className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-500 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {removingAvatar ? "Removing..." : "Remove Photo"}
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            JPG, PNG or WEBP. Square images look best. Max 2 MB.
          </p>

        </section>

        {/* ── APPEARANCE ─────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-7">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Palette className="w-6 h-6 text-[#0b46bc]" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-900 dark:text-white">Appearance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Personalize the way TaskHub looks.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Theme</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {theme === "light" ? "Switch to Dark mode." : "Switch to Light mode."}
                </p>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-xl bg-[#0b46bc] px-5 py-2.5 text-white font-semibold hover:bg-blue-700 transition"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    Light
                  </>
                )}
              </button>
            </div>
          </div>

        </section>

        {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-7">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Bell className="w-6 h-6 text-[#0b46bc]" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-900 dark:text-white">Notifications</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Control how TaskHub keeps you informed.</p>
            </div>
          </div>

          {loadingPrefs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <ToggleRow
                title="Email Notifications"
                description="Receive email updates about your account."
                value={emailNotifications}
                onChange={() => setEmailNotifications((p) => !p)}
              />
              <ToggleRow
                title="Task Notifications"
                description="Notify when tasks are assigned or updated."
                value={taskNotifications}
                onChange={() => setTaskNotifications((p) => !p)}
              />
              <ToggleRow
                title="Project Notifications"
                description="Get notified whenever project activity changes."
                value={projectNotifications}
                onChange={() => setProjectNotifications((p) => !p)}
              />
            </div>
          )}

        </section>

        {/* ── SECURITY ───────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-7">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#0b46bc]" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-900 dark:text-white">Security</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Change your password and secure your account.</p>
            </div>
          </div>

          <div className="space-y-5">

            {/* Current Password */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="w-full rounded-2xl bg-[#0b46bc] py-3 font-semibold text-white hover:bg-[#08379b] transition disabled:opacity-50"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>

          </div>

        </section>

        {/* ── SAVE SETTINGS ──────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-7">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Save Settings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Save your notification preferences.
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingPrefs || loadingPrefs}
              className="rounded-2xl bg-[#0b46bc] px-8 py-3 text-white font-semibold hover:bg-[#08379b] transition disabled:opacity-50"
            >
              {savingPrefs ? "Saving..." : "Save Settings"}
            </button>
          </div>

        </section>

      </div>
    </DashboardLayout>
  );
}

export default Settings;