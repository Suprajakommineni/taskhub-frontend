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
  if (!project) return null;
  return typeof project === "object" ? project.name : null;
}

function TimelineView({ tasks, memberMap, Avatar, STATUS_STYLE, PRIORITY_STYLE, onEdit, onDelete, showProject }: ViewProps) {
  const sorted = [...tasks]
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const undated = tasks.filter((t) => !t.dueDate);

  // Group by date string
  const groups = new Map<string, Task[]>();
  sorted.forEach((task) => {
    const key = new Date(task.dueDate).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(task);
  });

  if (tasks.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-12 border border-dashed border-slate-200 rounded-xl">
        No tasks found.
      </div>
    );
  }

  const renderTaskRow = (task: Task) => {
    const pr = PRIORITY_STYLE[task.priority];
    const assignees = (task.assignedTo || [])
      .map((u) => memberMap.get(u) ?? { username: u })
      .filter(Boolean) as Member[];
    const projectName = showProject ? getProjectName(task.project) : null;

    return (
      <div
        key={task._id}
        className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-900 text-sm truncate">{task.name}</h4>
            {projectName && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
                {projectName}
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-1 ${pr.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pr.dot}`} />
            {task.priority}
          </span>
        </div>

        <span className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${STATUS_STYLE[task.status]}`}>
          {task.status}
        </span>

        <div className="flex -space-x-2 shrink-0">
          {assignees.length === 0 ? (
            <span className="text-xs text-slate-400">Unassigned</span>
          ) : (
            assignees.slice(0, 3).map((m, i) => <Avatar key={`${m.username}-${i}`} member={m} size="sm" />)
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 shrink-0">
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
    );
  };

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([date, items]) => (
        <div key={date} className="relative pl-6">
          <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-[#0b46bc]" />
          <div className="absolute left-[4.5px] top-4 bottom-0 w-px bg-slate-200" />
          <p className="text-sm font-bold text-slate-700 mb-3">{date}</p>
          <div className="space-y-3">{items.map(renderTaskRow)}</div>
        </div>
      ))}

      {undated.length > 0 && (
        <div className="relative pl-6">
          <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300" />
          <p className="text-sm font-bold text-slate-400 mb-3">No due date</p>
          <div className="space-y-3">{undated.map(renderTaskRow)}</div>
        </div>
      )}
    </div>
  );
}

export default TimelineView;