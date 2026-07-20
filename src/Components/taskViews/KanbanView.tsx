import { CalendarDays, Pencil, Trash2 } from "lucide-react";

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

const COLUMNS: { key: Task["status"]; label: string; dot: string; badgeBg: string; badgeText: string }[] = [
  { key: "Pending", label: "Pending", dot: "bg-amber-400", badgeBg: "bg-amber-50", badgeText: "text-amber-700" },
  { key: "Running", label: "Running", dot: "bg-emerald-500", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700" },
  { key: "Completed", label: "Completed", dot: "bg-[#0b46bc]", badgeBg: "bg-blue-50", badgeText: "text-[#0b46bc]" },
];

function getProjectName(project?: Task["project"]) {
  if (!project) return null;
  return typeof project === "object" ? project.name : null;
}

function KanbanView({ tasks, memberMap, Avatar, PRIORITY_STYLE, onEdit, onDelete, showProject }: ViewProps) {
  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: tasks.filter((t) => t.status === col.key),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {grouped.map((col) => (
        <div key={col.key}>
          <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl ${col.badgeBg}`}>
            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
            <h3 className={`font-bold text-sm ${col.badgeText}`}>{col.label}</h3>
            <span className={`ml-auto text-xs font-bold ${col.badgeText} bg-white/70 rounded-full px-2 py-0.5`}>
              {col.items.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 items-stretch">
            {col.items.length === 0 && (
              <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-xl">
                No {col.label.toLowerCase()} tasks
              </div>
            )}

            {col.items.map((task) => {
              const pr = PRIORITY_STYLE[task.priority];
              const assignees = (task.assignedTo || [])
                .map((u) => memberMap.get(u) ?? { username: u })
                .filter(Boolean) as Member[];
              const projectName = showProject ? getProjectName(task.project) : null;

              return (
                <div
                  key={task._id}
                  className="flex flex-col h-full min-h-[180px] bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-base font-bold text-slate-900 leading-snug break-words">
                      {task.name}
                    </h2>
                    <span className={`flex items-center gap-1.5 shrink-0 text-xs font-semibold ${pr.text}`}>
                      <span className={`w-2 h-2 rounded-full ${pr.dot}`} />
                      {task.priority}
                    </span>
                  </div>

                  {projectName && (
                    <span className="inline-flex w-fit text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 mb-3">
                      {projectName}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                  </div>

                  <div className="flex-1" />

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      {assignees.length === 0 ? (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      ) : (
                        <>
                          {assignees.slice(0, 4).map((m, i) => (
                            <Avatar key={`${m.username}-${i}`} member={m} size="sm" />
                          ))}
                          {assignees.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white text-slate-500 flex items-center justify-center text-[11px] font-bold">
                              +{assignees.length - 4}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {(onEdit || onDelete) && (
                      <div className="flex items-center gap-1">
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KanbanView;