import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { type Priority, type Project, type ProjectStatus } from "../../data/mockdata";

interface Member {
  username: string;
  avatar: string;
}

interface ProjectTableViewProps {
  projects: Project[];
  Avatar: React.ComponentType<{ member: Member; size?: "sm" | "md" }>;
  PRIORITY_STYLE: Record<Priority, { dot: string; text: string; ring: string }>;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

const STATUS_BADGE: Record<ProjectStatus, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Running: "bg-emerald-50 text-emerald-700",
  Completed: "bg-blue-50 text-[#0b46bc]",
};

const formatDate = (date: string) => {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

function ProjectTableView({ projects, Avatar, PRIORITY_STYLE, onEdit, onDelete }: ProjectTableViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-12 border border-dashed border-slate-200 rounded-xl">
        No projects found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <th className="px-5 py-3">Project</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Progress</th>
              <th className="px-5 py-3">Tasks</th>
              <th className="px-5 py-3">Team</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const pr = PRIORITY_STYLE[project.priority];
              return (
                <tr key={project.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/projects/${project.id}/tasks`}
                      className="font-semibold text-slate-800 hover:text-[#0b46bc]"
                    >
                      {project.name}
                    </Link>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_BADGE[project.status]}`}>
                      {project.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${pr.text}`}>
                      <span className={`w-2 h-2 rounded-full ${pr.dot}`} />
                      {project.priority}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600">{formatDate(project.dueDate)}</td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 w-28">
                      <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0b46bc] rounded-full"
                          style={{ width: `${Math.max(0, Math.min(project.progress, 100))}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500 shrink-0">{project.progress}%</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600">{project.tasks}</td>

                  <td className="px-5 py-3.5">
                    {project.members.length === 0 ? (
                      <span className="text-xs text-slate-400">No members</span>
                    ) : (
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 4).map((member, index) => (
                          <Avatar key={`${member.username}-${index}`} member={member} size="sm" />
                        ))}
                        {project.members.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white text-slate-500 flex items-center justify-center text-[11px] font-bold">
                            +{project.members.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-[#0b46bc] transition-colors"
                        aria-label={`Edit ${project.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(project.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectTableView;