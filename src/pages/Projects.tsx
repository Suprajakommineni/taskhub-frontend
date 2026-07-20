import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
  LayoutGrid,
  Table2,
} from "lucide-react";

import DashboardLayout from "../Components/DashboardLayout";
import projectApi from "../api/projectapi";
import { useSearch } from "../Components/Search";
import { type Priority, type Project, type ProjectStatus } from "../data/mockdata";
import ProjectTableView from "../Components/projectviews/tableview";
import { useAppData } from "../context/Appdatacontext";

type ViewMode = "kanban" | "table";

interface Member {
  username: string;
  avatar: string;
}

interface DraftMember extends Member {
  localId: string;
}

interface BackendProject {
  _id?: string;
  id?: string;
  name: string;
  status?: string;
  priority?: string;
  progress?: number;
  tasks?: number;
  dueDate?: string;
  members?: Member[];
}

const STATUS_COLUMNS = [
  {
    key: "Pending" as ProjectStatus,
    label: "Pending",
    dot: "bg-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
    countBg: "bg-white dark:bg-slate-800",
  },
  {
    key: "Running" as ProjectStatus,
    label: "Running",
    dot: "bg-emerald-500",
    badgeBg: "bg-emerald-50 dark:bg-emerald-900/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    countBg: "bg-white dark:bg-slate-800",
  },
  {
    key: "Completed" as ProjectStatus,
    label: "Completed",
    dot: "bg-[#0b46bc]",
    badgeBg: "bg-blue-50 dark:bg-blue-900/30",
    badgeText: "text-[#0b46bc] dark:text-blue-400",
    countBg: "bg-white dark:bg-slate-800",
  },
];

const PRIORITY_STYLE: Record<Priority, { dot: string; text: string; ring: string }> = {
  High:   { dot: "bg-red-500",     text: "text-red-700 dark:text-red-400",       ring: "bg-red-50 dark:bg-red-900/30"     },
  Medium: { dot: "bg-orange-500",  text: "text-orange-700 dark:text-orange-400", ring: "bg-orange-50 dark:bg-orange-900/30" },
  Low:    { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", ring: "bg-emerald-50 dark:bg-emerald-900/30" },
};

const isStatus = (value?: string): value is ProjectStatus =>
  value === "Pending" || value === "Running" || value === "Completed";

const isPriority = (value?: string): value is Priority =>
  value === "Low" || value === "Medium" || value === "High";

const formatDate = (date: string) => {
  if (!date) return "No due date";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "No due date"
    : parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

function Avatar({ member, size = "md" }: { member: Member; size?: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  const initial = member.username.trim().charAt(0).toUpperCase() || "?";
  const dimension = size === "sm" ? "w-9 h-9 text-xs" : "w-12 h-12 text-sm";

  if (!member.avatar || failed) {
    return (
      <div
        title={member.username}
        className={`${dimension} shrink-0 rounded-full border-2 border-white dark:border-slate-800 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-[#0b46bc] dark:text-blue-400 shadow-sm flex items-center justify-center font-bold`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={member.avatar}
      alt={`${member.username}'s profile`}
      title={member.username}
      onError={() => setFailed(true)}
      className={`${dimension} shrink-0 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 object-cover shadow-sm`}
    />
  );
}

function Projects() {
  const { projects: rawProjects, setProjects: setStoreProjects, loadingProjects, refresh } = useAppData();

  const mapProject = (project: BackendProject): Project => ({
    id: project._id ?? project.id ?? "",
    name: project.name ?? "Untitled project",
    status: isStatus(project.status) ? project.status : "Pending",
    priority: isPriority(project.priority) ? project.priority : "Medium",
    progress: Number(project.progress ?? 0),
    tasks: Number(project.tasks ?? 0),
    dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
    members: Array.isArray(project.members)
      ? project.members
          .filter((member) => member?.username)
          .map((member) => ({ username: member.username, avatar: member.avatar ?? "" }))
      : [],
  });

  const projects = rawProjects.map(mapProject);

  const [view, setView] = useState<ViewMode>("kanban");
  const [showModal, setShowModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Pending");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [members, setMembers] = useState<DraftMember[]>([]);
  const [memberName, setMemberName] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [memberPhoto, setMemberPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const { search } = useSearch();

  const resetForm = () => {
    setProjectName("");
    setDueDate("");
    setStatus("Pending");
    setPriority("Medium");
    setMembers([]);
    setMemberName("");
    setMemberPhoto("");
    setPhotoLoading(false);
    setEditingProjectId(null);
  };

  const closeModal = () => { resetForm(); setShowModal(false); };
  const openAddModal = () => { resetForm(); setShowModal(true); };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const username = memberName.trim();
    if (!username) { alert("Enter the team member name before choosing their photo."); event.target.value = ""; return; }
    if (members.some((m) => m.username.toLowerCase() === username.toLowerCase())) { alert("This team member has already been added."); event.target.value = ""; return; }
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Please choose an image smaller than 2 MB."); return; }
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const avatar = typeof reader.result === "string" ? reader.result : "";
      if (!avatar) { alert("Unable to read this image. Please choose another one."); return; }
      // Member is added immediately once a photo is chosen — this is a
      // complete "add" action on its own, same as clicking the + button.
      setMembers((current) => [...current, { localId: crypto.randomUUID(), username, avatar }]);
      setMemberName("");
      setMemberPhoto("");
    };
    reader.onerror = () => { setMemberPhoto(""); alert("Unable to read this image."); };
    reader.onloadend = () => setPhotoLoading(false);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // Adds a member using just their name — avatar stays "" and the Avatar
  // component's fallback (first letter, colored circle) takes over when
  // rendering. This is the "no photo" path and it always adds the member.
  const addMember = () => {
    const username = memberName.trim();
    if (!username) { alert("Please enter a team member name."); return; }
    if (photoLoading) { alert("Please wait until the profile photo is ready."); return; }
    if (members.some((m) => m.username.toLowerCase() === username.toLowerCase())) { alert("This team member has already been added."); return; }
    setMembers((current) => [...current, { localId: crypto.randomUUID(), username, avatar: memberPhoto }]);
    setMemberName("");
    setMemberPhoto("");
    setPhotoLoading(false);
  };

  const removeMember = (localId: string) => {
    setMembers((current) => current.filter((m) => m.localId !== localId));
  };

  const editProject = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectName(project.name);
    setDueDate(project.dueDate);
    setStatus(project.status);
    setPriority(project.priority);
    setMembers((project.members ?? []).map((m) => ({ ...m, localId: crypto.randomUUID() })));
    setMemberName("");
    setMemberPhoto("");
    setPhotoLoading(false);
    setShowModal(true);
  };

  const saveProject = async () => {
    if (!projectName.trim()) { alert("Please enter a project name."); return; }
    if (!dueDate) { alert("Please select a due date."); return; }
    setSaving(true);
    const payload = {
      name: projectName.trim(),
      dueDate,
      status,
      priority,
      members: members.map(({ username, avatar }) => ({ username, avatar })),
      progress: status === "Completed" ? 100 : status === "Running" ? 50 : 0,
    };
    try {
      if (editingProjectId) await projectApi.put(`/${editingProjectId}`, payload);
      else await projectApi.post("/", payload);
      await refresh();
      closeModal();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string; error?: string } } };
      const message = apiError.response?.data?.error ?? apiError.response?.data?.message ?? "Failed to save the project. Please try again.";
      console.error("Unable to save project:", message, error);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await projectApi.delete(`/${id}`);
      setStoreProjects((current) => current.filter((p) => (p._id ?? p.id) !== id));
    } catch (error) {
      console.error("Unable to delete project:", error);
      alert("Failed to delete the project. Please try again.");
    }
  };

  const normalizedSearch = (search ?? "").trim().toLowerCase();

  const filteredProjects = normalizedSearch
    ? projects.filter((project) => {
        const nameMatch = project.name.toLowerCase().includes(normalizedSearch);
        const memberMatch = (project.members ?? []).some((member) =>
          member.username.toLowerCase().includes(normalizedSearch)
        );
        const statusMatch = project.status.toLowerCase().includes(normalizedSearch);
        const priorityMatch = project.priority.toLowerCase().includes(normalizedSearch);
        return nameMatch || memberMatch || statusMatch || priorityMatch;
      })
    : projects;

  const grouped = STATUS_COLUMNS.map((col) => ({
    ...col,
    items: filteredProjects.filter((p) => p.status === col.key),
  }));

  const inputClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-800 dark:text-slate-200 shadow-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0b46bc] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30";

  if (loadingProjects && projects.length === 0)
    return (
      <DashboardLayout title="Projects" subtitle="Loading your workspace...">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
          Loading projects…
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Projects" subtitle="View all projects and track progress.">

      {/* TOOLBAR - stacks on mobile, row on larger screens */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm transition ${
              view === "kanban"
                ? "bg-[#0b46bc] text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm transition ${
              view === "table"
                ? "bg-[#0b46bc] text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>Table</span>
          </button>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0b46bc] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#093a9e] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Empty state when a search yields nothing */}
      {normalizedSearch && filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 px-5 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
          No projects match "{search}"
        </div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {grouped.map((column) => (
            <section key={column.key}>
              <div className={`mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 ${column.badgeBg}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                <h2 className={`text-sm font-bold ${column.badgeText}`}>{column.label}</h2>
                <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ${column.countBg} ${column.badgeText}`}>
                  {column.items.length}
                </span>
              </div>

              <div className="space-y-4">
                {column.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    No {column.label.toLowerCase()} projects
                  </div>
                ) : (
                  column.items.map((project) => {
                    const priorityStyle = PRIORITY_STYLE[project.priority];
                    return (
                      <article
                        key={project.id}
                        className="group min-h-[220px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            to={`/projects/${project.id}/tasks`}
                            className="min-w-0 text-base font-bold text-slate-900 dark:text-slate-100 transition hover:text-[#0b46bc] dark:hover:text-blue-400"
                          >
                            <span className="break-words">{project.name}</span>
                          </Link>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyle.ring} ${priorityStyle.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
                            {project.priority}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            {formatDate(project.dueDate)}
                          </span>
                          <span>
                            {project.tasks} {project.tasks === 1 ? "task" : "tasks"}
                          </span>
                          <Link
                            to={`/projects/${project.id}/tasks`}
                            className="text-[#0b46bc] dark:text-blue-400 font-semibold hover:underline"
                          >
                            View Tasks
                          </Link>
                        </div>

                        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
                          <div
                            className="h-full rounded-full bg-[#0b46bc] transition-all"
                            style={{ width: `${Math.max(0, Math.min(project.progress, 100))}%` }}
                          />
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                          <div className="flex min-w-0 items-center">
                            <Users className="mr-2 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                            {project.members.length === 0 ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500">No members yet</span>
                            ) : (
                              <div className="flex -space-x-2">
                                {project.members.slice(0, 4).map((member, index) => (
                                  <Avatar key={`${member.username}-${index}`} member={member} size="sm" />
                                ))}
                                {project.members.length > 4 && (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    +{project.members.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Edit ${project.name}`}
                              onClick={() => editProject(project)}
                              className="rounded-lg p-2 text-[#0b46bc] dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${project.name}`}
                              onClick={() => deleteProject(project.id)}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <ProjectTableView
          projects={filteredProjects}
          Avatar={Avatar}
          PRIORITY_STYLE={PRIORITY_STYLE}
          onEdit={editProject}
          onDelete={deleteProject}
        />
      )}

      {/* MODAL */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-5 sm:px-6 py-5 backdrop-blur">
              <div>
                <h2 id="project-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {editingProjectId ? "Edit project" : "Create a project"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Set the details and add your team.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Project name
                  </span>
                  <input
                    autoFocus
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="e.g. Website redesign"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Due date
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Priority
                  </span>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as Priority)}
                    className={inputClass}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Team members {members.length > 0 && `(${members.length})`}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Type a name and press Enter (or tap +) to add them — a photo is optional. Without one, their initial shows in a colored circle.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={memberName}
                    onChange={(event) => setMemberName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addMember();
                      }
                    }}
                    placeholder="Member name"
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <label
                      title="Choose profile photo (optional)"
                      className="flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700"
                    >
                      <Camera className="h-5 w-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                    <button
                      type="button"
                      onClick={addMember}
                      disabled={!memberName.trim() || photoLoading}
                      aria-label="Add member"
                      className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-[#0b46bc] text-white transition hover:bg-[#093a9e] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {photoLoading && (
                  <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Preparing profile photo…
                  </p>
                )}

                {members.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.localId}
                        className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar member={member} />
                          <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {member.username}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(member.localId)}
                          aria-label={`Remove ${member.username}`}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {members.length === 0 && (
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    No team members added yet.
                  </p>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProjectStatus)}
                  className={inputClass}
                >
                  <option value="Pending">Pending</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProject}
                  disabled={saving}
                  className="rounded-xl bg-[#0b46bc] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#093a9e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingProjectId ? "Save changes" : "Create project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Projects;