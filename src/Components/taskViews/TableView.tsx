import { Pencil, Trash2 } from "lucide-react";

interface Member {
  username: string;
  avatar?: string;
}

interface Task {
  _id: string;
  name: string;
  status: "Pending" | "Running" | "Completed";
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  assignedTo?: string[];
  project?: { _id: string; name: string } | string;
}

interface ViewProps {
  tasks: Task[];
  memberMap: Map<string, Member>;
  Avatar: React.ComponentType<{ member: Member; size?: "sm" | "md" }>;
  STATUS_STYLE: Record<string, string>;
  PRIORITY_STYLE: Record<string, { dot: string; text: string; ring: string }>;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  showProject?: boolean;
}

function getProjectName(project?: Task["project"]) {
  if (!project) return "—";
  return typeof project === "object" ? project.name : "—";
}

function TableView({ tasks, memberMap, Avatar, STATUS_STYLE, PRIORITY_STYLE, onEdit, onDelete, showProject }: ViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-12 border border-dashed border-slate-200 rounded-xl">
        No tasks found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <th className="px-5 py-3">Task</th>
              {showProject && <th className="px-5 py-3">Project</th>}
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Due Date</th>
              <th className="px-5 py-3">Assigned</th>
              {(onEdit || onDelete) && <th className="px-5 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const pr = PRIORITY_STYLE[task.priority];
              const assignees = (task.assignedTo || [])
                .map((u) => memberMap.get(u) ?? { username: u })
                .filter(Boolean) as Member[];

              return (
                <tr key={task._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{task.name}</td>

                  {showProject && (
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                        {getProjectName(task.project)}
                      </span>
                    </td>
                  )}

                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_STYLE[task.status]}`}>
                      {task.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${pr.text}`}>
                      <span className={`w-2 h-2 rounded-full ${pr.dot}`} />
                      {task.priority}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                  </td>

                  <td className="px-5 py-3.5">
                    {assignees.length === 0 ? (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    ) : (
                      <div className="flex -space-x-2">
                        {assignees.slice(0, 4).map((m, i) => (
                          <Avatar key={`${m.username}-${i}`} member={m} size="sm" />
                        ))}
                        {assignees.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white text-slate-500 flex items-center justify-center text-[11px] font-bold">
                            +{assignees.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {(onEdit || onDelete) && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-[#0b46bc] transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(task._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableView;