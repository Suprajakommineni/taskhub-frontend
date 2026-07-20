import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import API from "../api/api";
import projectApi from "../api/projectapi";
import taskApi from "../api/taskapi";

interface AppUser {
  username: string;
  email: string;
  avatarUrl: string;
}

interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  runningTasks: number;
  pendingTasks: number;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  runningTasks: 0,
  pendingTasks: 0,
};

interface AppDataValue {
  user: AppUser;
  setUser: React.Dispatch<React.SetStateAction<AppUser>>;
  notifications: any[];
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  loadingProjects: boolean;
  refresh: () => Promise<void>;
  // All tasks across every project (used by Dashboard) — fetched once here
  // instead of Dashboard.tsx fetching its own duplicate copy.
  tasks: any[];
  dashboardSummary: DashboardSummary;
  // Per-project task lists (used by ProjectTasks) — kept separate from
  // `tasks` above because it's a different endpoint/shape and only needs
  // to be fetched for the project currently being viewed.
  tasksByProject: Record<string, any[]>;
  setTasksByProject: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  loadingTasks: Record<string, boolean>;
  refreshTasks: (projectId: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

// Routes where we should NOT try to load user data (no token yet).
const PUBLIC_PATHS = ["/", "/login", "/register"];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<AppUser>({ username: "", email: "", avatarUrl: "" });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);

  const [tasksByProject, setTasksByProject] = useState<Record<string, any[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});
  const taskInFlight = useRef<Record<string, Promise<void> | undefined>>({});

  const inFlight = useRef<Promise<void> | null>(null);
  const loadedOnce = useRef(false); // true after a SUCCESSFUL load

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;

    const run = (async () => {
      try {
        console.log("[v0] refresh() fetching...");
        // Everything the app shell + Dashboard need, fetched exactly once.
        // Previously Dashboard.tsx ran its own separate Promise.all that
        // re-fetched projects (and added tasks/summary) on top of this one —
        // doubling the request count and queueing behind the browser's
        // per-host connection limit, which is what made the dashboard feel
        // slow to load.
        const [userRes, notifRes, projRes, taskRes, summaryRes] = await Promise.all([
          API.get("/api/users/me"),
          API.get("/api/notifications"),
          projectApi.get("/"),
          taskApi.get("/"),
          API.get("/api/dashboard/summary"),
        ]);
        console.log("[v0] refresh() got projects:", projRes.data);
        setUser({
          username: userRes.data.username || "",
          email: userRes.data.email || "",
          avatarUrl: userRes.data.avatarUrl || "",
        });
        setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);

        const nextProjects = Array.isArray(projRes.data)
          ? projRes.data
          : Array.isArray(projRes.data?.projects)
          ? projRes.data.projects
          : [];
        setProjects(nextProjects);

        const nextTasks = Array.isArray(taskRes.data)
          ? taskRes.data
          : Array.isArray(taskRes.data?.tasks)
          ? taskRes.data.tasks
          : [];
        setTasks(nextTasks);

        setDashboardSummary(summaryRes.data || EMPTY_SUMMARY);

        loadedOnce.current = true; // mark success so we stop retrying
      } catch (error) {
        console.error("App data error:", error);
      } finally {
        setLoadingProjects(false);
        inFlight.current = null;
      }
    })();

    inFlight.current = run;
    return run;
  }, []);

  // Per-project task list — used by the ProjectTasks page. Deduped with an
  // in-flight ref the same way refresh() is, and kept in context (rather
  // than component-local state) so navigating away and back doesn't reset
  // it to empty and force a visible "only shows after refresh" flash.
  const refreshTasks = useCallback(async (projectId: string) => {
    if (!projectId) return;
    if (taskInFlight.current[projectId]) return taskInFlight.current[projectId];

    setLoadingTasks((prev) => ({ ...prev, [projectId]: true }));

    const run = (async () => {
      try {
        const res = await taskApi.get(`/project/${projectId}`);
        const nextProjectTasks = Array.isArray(res.data) ? res.data : [];
        setTasksByProject((prev) => ({ ...prev, [projectId]: nextProjectTasks }));
      } catch (error) {
        console.error("Task data error:", error);
      } finally {
        setLoadingTasks((prev) => ({ ...prev, [projectId]: false }));
        taskInFlight.current[projectId] = undefined;
      }
    })();

    taskInFlight.current[projectId] = run;
    return run;
  }, []);

  // Fetch whenever we're on an authenticated page and haven't loaded yet.
    useEffect(() => {
    const isPublic = PUBLIC_PATHS.includes(location.pathname);
    console.log("[v0] route change:", location.pathname, "isPublic:", isPublic, "loadedOnce:", loadedOnce.current, "projects:", projects.length);
    if (!isPublic && !loadedOnce.current) {
      void refresh();
    }
  }, [location.pathname, refresh]);
  // Background polling + manual refresh events (only after a successful load).
  useEffect(() => {
    const interval = setInterval(() => {
      if (loadedOnce.current) void refresh();
    }, 60000);
    const onRefresh = () => void refresh();
    window.addEventListener("dashboard-refresh", onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("dashboard-refresh", onRefresh);
    };
  }, [refresh]);

  return (
    <AppDataContext.Provider
      value={{
        user,
        setUser,
        notifications,
        projects,
        setProjects,
        loadingProjects,
        refresh,
        tasks,
        dashboardSummary,
        tasksByProject,
        setTasksByProject,
        loadingTasks,
        refreshTasks,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside <AppDataProvider>");
  return ctx;
}