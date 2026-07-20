import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import KanbanView from "../Components/taskViews/KanbanView";
import TableView from "../Components/taskViews/TableView";
import ListView from "../Components/taskViews/ListView";
import TimelineView from "../Components/taskViews/TimelineView";

import DashboardLayout from "../Components/DashboardLayout";
import taskApi from "../api/taskapi";
import { useSearch } from "../Components/Search";
import { useAppData } from "../context/Appdatacontext";
import { LayoutGrid, Table2, List, CalendarRange } from "lucide-react";

type TaskStatus = "Pending" | "Running" | "Completed";
type TaskPriority = "Low" | "Medium" | "High";
type ViewMode = "kanban" | "table" | "list" | "timeline";

interface Member {
  username: string;
  avatar?: string;
}

interface Task {
  _id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo?: string[];
}

const PRIORITY_STYLE: Record<TaskPriority, { dot: string; text: string; ring: string }> = {
  High:   { dot: "bg-red-500",     text: "text-red-700 dark:text-red-400",         ring: "bg-red-50 dark:bg-red-900/30"       },
  Medium: { dot: "bg-orange-500",  text: "text-orange-700 dark:text-orange-400",   ring: "bg-orange-50 dark:bg-orange-900/30" },
  Low:    { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", ring: "bg-emerald-50 dark:bg-emerald-900/30" },
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  Running:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Completed: "bg-blue-100 text-[#0b46bc] dark:bg-blue-900/30 dark:text-blue-400",
};

function Avatar({ member, size = "sm" }: { member: Member; size?: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  const initial = member.username?.trim().charAt(0).toUpperCase() || "?";
  const dimension = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  if (!member.avatar || failed) {
    return (
      <div
        title={member.username}
        className={`${dimension} shrink-0 rounded-full border-2 border-white dark:border-slate-800 bg-blue-100 dark:bg-blue-900/40 text-[#0b46bc] dark:text-blue-400 flex items-center justify-center font-bold`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={member.avatar}
      alt={member.username}
      title={member.username}
      onError={() => setFailed(true)}
      className={`${dimension} shrink-0 rounded-full border-2 border-white dark:border-slate-800 object-cover`}
    />
  );
}

function ProjectTasks() {
  const { projectId } = useParams();
  const { projects, tasksByProject, loadingTasks, refreshTasks, setTasksByProject } = useAppData();
  const { search } = useSearch();

  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [taskName, setTaskName] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [status, setStatus] = useState<TaskStatus>("Pending");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [view, setView] = useState<ViewMode>("kanban");

  const currentProject = projects.find((p: any) => (p._id ?? p.id) === projectId);
  const projectName = currentProject?.name ?? "";
  const projectMembers: Member[] = useMemo(
    () =>
      Array.isArray(currentProject?.members)
        ? currentProject.members
            .filter((m: any) => m && m.username)
            .map((m: any) => ({ username: m.username, avatar: m.avatar || "" }))
        : [],
    [currentProject]
  );

  const tasks: Task[] = tasksByProject[projectId ?? ""] ?? [];
  const loading = loadingTasks[projectId ?? ""] !== false && tasks.length === 0;
  
  useEffect(() => {
    if (projectId) void refreshTasks(projectId);
  }, [projectId, refreshTasks]);

  const memberMap = new Map(projectMembers.map((m) => [m.username, m]));

  const resetForm = () => {
    setTaskName("");
    setSelectedAssignees([]);
    setStatus("Pending");
    setPriority("Medium");
    setDueDate("");
    setEditingTaskId(null);
    setShowAssigneeDropdown(false);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task._id);
    setTaskName(task.name);
    setSelectedAssignees(Array.isArray(task.assignedTo) ? task.assignedTo : []);
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
    setShowModal(true);
  };

  const toggleAssignee = (username: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const saveTask = async () => {
    if (!taskName.trim()) { alert("Please enter task name."); return; }
    if (!dueDate) { alert("Please select due date."); return; }
    if (!projectId) return;

    try {
      const payload = { name: taskName, assignedTo: selectedAssignees, status, priority, dueDate, project: projectId };
      if (editingTaskId) await taskApi.put(`/${editingTaskId}`, payload);
      else await taskApi.post("/", payload);
      await refreshTasks(projectId);
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save task.");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?") || !projectId) return;
    try {
      await taskApi.delete(`/${taskId}`);
      setTasksByProject((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] ?? []).filter((t) => t._id !== taskId),
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to delete task.");
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    const haystack = [task.name, task.status, task.priority, ...(task.assignedTo || [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const inputClass =
    "w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600";

  const viewBtnClass = (active: boolean) =>
    `flex items-center gap-2 rounded-xl px-4 py-2 transition ${
      active
        ? "bg-[#0b46bc] text-white"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  if (loading) {
    return (
      <DashboardLayout title={projectName || "Project Tasks"} subtitle="Loading...">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-sm text-slate-500 dark:text-slate-400">
          Loading tasks...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={projectName || "Project Tasks"} subtitle="Manage project tasks">

      {/* HEADER - stacks on mobile, row on larger screens */}
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
  <Link
    to="/projects"
    className="flex items-center gap-2 text-[#0b46bc] dark:text-blue-400 font-semibold hover:underline"
  >
    <ArrowLeft className="w-5 h-5" />
    Back to Projects
  </Link>

  <button
    onClick={openAddModal}
    className="w-full sm:w-auto bg-[#0b46bc] text-white px-5 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#093a9e] transition-colors"
  >
    <Plus className="w-5 h-5" />
    New Task
  </button>
</div>

{/* VIEW TOGGLE - wraps and fills width on mobile, fits content on desktop */}
<div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 w-full sm:w-fit">
  <button onClick={() => setView("kanban")} className={`flex-1 sm:flex-none justify-center ${viewBtnClass(view === "kanban")}`}>
    <LayoutGrid className="w-4 h-4" /> <span className="hidden xs:inline">Kanban</span>
  </button>
  <button onClick={() => setView("table")} className={`flex-1 sm:flex-none justify-center ${viewBtnClass(view === "table")}`}>
    <Table2 className="w-4 h-4" /> <span className="hidden xs:inline">Table</span>
  </button>
  <button onClick={() => setView("list")} className={`flex-1 sm:flex-none justify-center ${viewBtnClass(view === "list")}`}>
    <List className="w-4 h-4" /> <span className="hidden xs:inline">List</span>
  </button>
  <button onClick={() => setView("timeline")} className={`flex-1 sm:flex-none justify-center ${viewBtnClass(view === "timeline")}`}>
    <CalendarRange className="w-4 h-4" /> <span className="hidden xs:inline">Timeline</span>
  </button>
</div>

      

      {/* VIEWS */}
      {view === "kanban" && (
        <KanbanView tasks={filteredTasks} memberMap={memberMap} Avatar={Avatar}
          STATUS_STYLE={STATUS_STYLE} PRIORITY_STYLE={PRIORITY_STYLE}
          onEdit={openEditModal} onDelete={deleteTask} />
      )}
      {view === "table" && (
        <TableView tasks={filteredTasks} memberMap={memberMap} Avatar={Avatar}
          STATUS_STYLE={STATUS_STYLE} PRIORITY_STYLE={PRIORITY_STYLE}
          onEdit={openEditModal} onDelete={deleteTask} />
      )}
      {view === "list" && (
        <ListView tasks={filteredTasks} memberMap={memberMap} Avatar={Avatar}
          STATUS_STYLE={STATUS_STYLE} PRIORITY_STYLE={PRIORITY_STYLE}
          onEdit={openEditModal} onDelete={deleteTask} />
      )}
      {view === "timeline" && (
        <TimelineView tasks={filteredTasks} memberMap={memberMap} Avatar={Avatar}
          STATUS_STYLE={STATUS_STYLE} PRIORITY_STYLE={PRIORITY_STYLE}
          onEdit={openEditModal} onDelete={deleteTask} />
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {editingTaskId ? "Edit Task" : "New Task"}
              </h2>
              <button
                type="button"
                onClick={() => { resetForm(); setShowModal(false); }}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">

              {/* Task name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Task Name
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Enter task name"
                  className={inputClass}
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Assign To
                </label>

                <button
                  type="button"
                  onClick={() => setShowAssigneeDropdown((prev) => !prev)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                >
                  {selectedAssignees.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500 text-sm">Select team member(s)</span>
                  ) : (
                    <div className="flex -space-x-2">
                      {selectedAssignees.slice(0, 5).map((username, index) => {
                        const member = memberMap.get(username) ?? { username };
                        return <Avatar key={`${username}-${index}`} member={member} size="sm" />;
                      })}
                      {selectedAssignees.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[11px] font-bold">
                          +{selectedAssignees.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {selectedAssignees.length > 0 ? `${selectedAssignees.length} selected` : ""}
                  </span>
                </button>

                {showAssigneeDropdown && (
                  <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {projectMembers.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 p-4">
                        No members added to this project yet.
                      </p>
                    ) : (
                      projectMembers.map((member) => {
                        const isSelected = selectedAssignees.includes(member.username);
                        return (
                          <button
                            type="button"
                            key={member.username}
                            onClick={() => toggleAssignee(member.username)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Avatar member={member} size="sm" />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1 truncate">
                              {member.username}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-[#0b46bc] dark:text-blue-400 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Due date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Status + Priority */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className={inputClass}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className={inputClass}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={saveTask}
                className="w-full bg-[#0b46bc] text-white py-3 rounded-2xl font-bold hover:bg-[#08379b] transition"
              >
                {editingTaskId ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ProjectTasks;