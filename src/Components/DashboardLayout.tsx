import { useSearch } from "../Components/Search";
import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  FolderKanban,
  CalendarDays,
  SettingsIcon,
} from "lucide-react";
import { useAppData } from "../context/Appdatacontext";

type DashboardLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

const PROJECT_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981",
  "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6",
];

function getProjectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function isProjectNotification(item: any): boolean {
  if (!item || typeof item !== "object") return false;
  if ("project" in item) return false;
  return "members" in item || "progress" in item || "priority" in item || "tasks" in item;
}

function formatNotificationDate(date?: string) {
  if (!date) return "No due date";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "No due date"
    : parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const { search, setSearch } = useSearch();

  const { user, notifications, projects } = useAppData();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Projects", icon: FolderKanban, path: "/projects" },
    { name: "Settings", icon: SettingsIcon, path: "/settings" },
    { name: "Analytics", icon: BarChart3, path: "/analytics" },
  ];

  const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function CalendarPopup() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const todayDate = today.getDate();

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
      ...Array(firstDayOfWeek).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Calendar</h2>
            <button
              onClick={() => setShowCalendar(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
              {today.toLocaleDateString(undefined, { weekday: "long" })}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
              {MONTH_NAMES[month]} {todayDate}, {year}
            </p>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {label}
                </span>
              ))}
              {cells.map((day, i) => (
                <span
                  key={i}
                  className={`text-xs rounded-full w-8 h-8 flex items-center justify-center mx-auto ${
                    day === todayDate
                      ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30"
                      : day
                      ? "text-slate-700 dark:text-slate-300"
                      : ""
                  }`}
                >
                  {day ?? ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 h-full
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* LOGO */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            TaskHub
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* MAIN MENU */}
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-4 mb-3 uppercase">
            Main Menu
          </p>

          <nav className="space-y-1">
            {/* SEARCH - expands inline below itself when clicked */}
            <div>
              <button
                onClick={() => setShowSearchInput((prev) => !prev)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                  showSearchInput
                    ? "bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={2} />
                Search
                {search && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              {showSearchInput && (
                <div className="mt-1 mb-1 px-1">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Type to search..."
                      autoFocus
                      className="outline-none text-sm bg-transparent w-full text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      type="text"
                      name="sidebar-search"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore
                    />
                    {search && (
                      <button onClick={() => setSearch("")} aria-label="Clear search">
                        <X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* NOTIFICATIONS - shows count, expands dropdown below itself */}
            <div>
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                  showNotifications
                    ? "bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Bell className="w-[18px] h-[18px]" strokeWidth={2} />
                Notifications
                {notifications.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="mt-1 mb-1 mx-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No notifications</p>
                  ) : (
                    notifications.map((item: any) => {
                      const isProject = isProjectNotification(item);
                      return (
                        <div
                          key={item._id}
                          className="p-3 border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                            {item.name}
                          </p>
                          {!isProject && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Project {item.project?.name}
                            </p>
                          )}
                          <p className="text-xs text-red-500 dark:text-red-400 font-semibold">
                            Due: {formatNotificationDate(item.dueDate)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  {item.name}
                </Link>
              );
            })}

            <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 w-full text-left"
            >
              <CalendarDays className="w-[18px] h-[18px]" strokeWidth={2} />
              Calendar
            </button>
          </nav>

          {/* MY PROJECTS */}
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-6 mb-3 uppercase">
            My Projects
          </p>

          <nav className="space-y-1">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 px-3">No projects yet</p>
            ) : (
              projects.slice(0, 6).map((project) => {
                const active = location.pathname === `/projects/${project._id}/tasks`;
                const initial = project.name ? project.name.charAt(0).toUpperCase() : "P";
                const color = getProjectColor(project.name || project._id);

                return (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}/tasks`}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initial}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })
            )}
          </nav>

          {/* ACCOUNT */}
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide mt-6 mb-3 uppercase">
            Account
          </p>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
              {user.username}
            </span>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </Link>
        </div>

        {showCalendar && <CalendarPopup />}
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="relative flex items-center gap-3 mb-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-slate-700 dark:text-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 text-balance">
              {title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;