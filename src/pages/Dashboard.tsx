import { Link } from "react-router-dom";
import { ArrowRight, Plus, AlertTriangle, Clock, CalendarClock, CheckCircle2, Circle, Loader2 } from "lucide-react";
import DashboardLayout from "../Components/DashboardLayout";
import { useState } from "react";
import taskApi from "../api/taskapi";
import { useSearch } from "../Components/Search";
import { useAppData } from "../context/Appdatacontext";

interface Member {
  username: string;
  avatar?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  members?: Member[];
  progress?: number;
  tasks?: number;
}

interface Task {
  _id: string;
  name: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt?: string;
  project?: { _id: string; name: string } | string;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const STATUS_META: Record<string, { label: string; icon: any; badge: string }> = {
  Completed: { label: "Completed", icon: CheckCircle2, badge: "bg-blue-50 text-[#0b46bc] dark:bg-blue-900/30 dark:text-blue-400" },
  Running:   { label: "Running",   icon: Loader2,      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  Pending:   { label: "Pending",   icon: Circle,       badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

function Dashboard() {
  const { projects: rawProjects, tasks: rawTasks, dashboardSummary, loadingProjects, refresh } = useAppData();
  const projects = rawProjects as Project[];
  const tasks = rawTasks as Task[];
  const data = dashboardSummary;
  const loading = loadingProjects && projects.length === 0;
  const [quickAdd, setQuickAdd] = useState("");
  const [quickAddProjectId, setQuickAddProjectId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const { search } = useSearch();

  const normalizedSearch = search.trim().toLowerCase();

  const memberNames = (project: Project) =>
    (project.members || [])
      .map((m) => (typeof m === "string" ? m : m?.username))
      .filter(Boolean) as string[];

  const filteredProjects = (Array.isArray(projects) ? projects : []).filter((project) => {
    const haystack = [project.name, project.description, project.status, ...memberNames(project)]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const totalMembers = new Set(
    projects.flatMap((project) => (project.members || []).map((member) => member.username))
  ).size;

  const today = new Date();

  const dueTodayTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "Completed") return false;
    return isSameDay(new Date(t.dueDate), today);
  });

  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "Completed") return false;
    const due = new Date(t.dueDate);
    return due < today && !isSameDay(due, today);
  });

  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const recentActivity = [...tasks]
    .sort((a: any, b: any) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    )
    .slice(0, 5);

  const activeProjects = filteredProjects.filter((p) => (p.progress ?? 0) < 100).slice(0, 3);

  const handleQuickAdd = async () => {
    if (!quickAdd.trim()) return;
    if (!quickAddProjectId) {
      alert("Pick a project first (tap a chip above the input).");
      return;
    }
    setAddingTask(true);
    try {
      await taskApi.post("/", {
        name: quickAdd.trim(),
        status: "Pending",
        priority: "Medium",
        project: quickAddProjectId,
      });
      setQuickAdd("");
      await refresh();
    } catch (err) {
      console.error("Quick add task failed:", err);
      alert("Couldn't add task. Please try again or use the Tasks page.");
    } finally {
      setAddingTask(false);
    }
  };

  const stats = [
    ["Total Projects",   data.totalProjects],
    ["Total Tasks",      data.totalTasks],
    ["Completed Tasks",  data.completedTasks],
    ["Running Tasks",    data.runningTasks],
    ["Pending Tasks",    data.pendingTasks],
    ["Team working in tasks",  totalMembers],
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-sm text-slate-500 dark:text-slate-400">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back to TaskHub">

      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 p-8 mb-6">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back 👋
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Here's what's happening across your projects today.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-56 h-56 bg-blue-200/40 dark:bg-blue-800/20 rounded-full blur-2xl" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-indigo-200/40 dark:bg-indigo-800/20 rounded-full blur-2xl" />
      </section>

      {/* ALERT BANNER */}
      {(dueTodayTasks.length > 0 || overdueTasks.length > 0) && (
        <section
          className={`rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-4 border ${
            overdueTasks.length > 0
              ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800"
          }`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              overdueTasks.length > 0
                ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-[200px]">
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {overdueTasks.length > 0 && (
                <span className="text-red-600 dark:text-red-400">{overdueTasks.length} overdue</span>
              )}
              {overdueTasks.length > 0 && dueTodayTasks.length > 0 && " · "}
              {dueTodayTasks.length > 0 && (
                <span className={overdueTasks.length > 0 ? "text-slate-700 dark:text-slate-300" : "text-amber-700 dark:text-amber-400"}>
                  {dueTodayTasks.length} due today
                </span>
              )}
            </p>
            {overdueTasks.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Attention needed</p>
            )}
          </div>

          <Link
            to="/tasks"
            className="text-sm font-semibold text-[#0b46bc] dark:text-blue-400 flex items-center gap-1 shrink-0 hover:underline"
          >
            View tasks <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* QUICK ADD */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-3">
          Quick Add
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            placeholder="Quick add a task..."
            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
          />
          <button
            onClick={handleQuickAdd}
            disabled={addingTask || !quickAdd.trim() || !quickAddProjectId}
            className="bg-[#0b46bc] text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 hover:bg-[#093a9e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {addingTask ? "Adding..." : "Add Task"}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Project:</span>
          {projects.length === 0 ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">No projects yet</span>
          ) : (
            projects.map((project) => (
              <button
                key={project._id}
                type="button"
                onClick={() => setQuickAddProjectId(project._id)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                  quickAddProjectId === project._id
                    ? "bg-[#0b46bc] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {project.name}
              </button>
            ))
          )}
        </div>
      </section>

      {/* 3-COLUMN GRID */}
      <section className="grid xl:grid-cols-3 gap-6 mb-6 items-stretch">

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-5">
            <CalendarClock className="w-[18px] h-[18px] text-[#0b46bc] dark:text-blue-400" />
            Upcoming Deadlines
          </h3>

          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Nothing due soon.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcomingTasks.map((task) => {
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = due && due < today && !isSameDay(due, today);
                const isToday = due && isSameDay(due, today);

                return (
                  <div
                    key={task._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{task.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {typeof task.project === "object" ? task.project?.name : "—"}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        isOverdue
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : isToday
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-[#0b46bc] dark:text-blue-400"
                      }`}
                    >
                      {due?.toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">Active Projects</h3>

          {activeProjects.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No active projects match your search.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {activeProjects.map((project) => (
                <div key={project._id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{project.name}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0 text-xs">
                      {project.progress ?? 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0b46bc] rounded-full transition-all"
                      style={{ width: `${project.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <Clock className="w-[18px] h-[18px] text-[#0b46bc] dark:text-blue-400" />
            Recent Activity
          </h3>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No recent activity.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {recentActivity.map((task) => {
                const meta = STATUS_META[task.status] ?? STATUS_META.Pending;
                const StatusIcon = meta.icon;
                return (
                  <div
                    key={task._id}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.badge}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {task.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {typeof task.project === "object" ? task.project?.name : "No project"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Projects</h3>
          <Link
            to="/projects"
            className="bg-[#0b46bc] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#093a9e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {filteredProjects.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 col-span-full">
              No recent projects match your search.
            </p>
          ) : (
            filteredProjects
              .slice()
              .reverse()
              .slice(0, 3)
              .map((project) => (
                <div
                  key={project._id}
                  className="border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl p-5 hover:shadow-sm transition-shadow"
                >
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{project.name}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {project.progress || 0}% complete · {project.tasks || 0} tasks
                  </p>
                  <Link
                    to={`/projects/${project._id}/tasks`}
                    className="inline-flex items-center gap-1.5 mt-4 text-[#0b46bc] dark:text-blue-400 font-semibold text-sm hover:underline"
                  >
                    View Tasks
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(([title, value]) => (
          <div
            key={String(title)}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wide">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">{value ?? 0}</h4>
          </div>
        ))}
      </section>

    </DashboardLayout>
  );
}

export default Dashboard;