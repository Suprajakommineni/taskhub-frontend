import {
  CheckCircle,
  Clock,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../Components/DashboardLayout";
import { useAppData } from "../context/Appdatacontext";

function Analytics() {
  const { projects, loadingProjects } = useAppData();

  if (loadingProjects && projects.length === 0) {
    return (
      <DashboardLayout title="Analytics" subtitle="Loading analytics...">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
          Loading analytics…
        </div>
      </DashboardLayout>
    );
  }

  const completedProjects = projects.filter(
    (project) => project.status === "Completed"
  ).length;

  const pendingProjects = projects.filter(
    (project) => project.status === "Pending"
  ).length;

  const runningProjects = projects.filter(
    (project) => project.status === "Running"
  ).length;

  const totalTasks = projects.reduce(
    (sum, project) => sum + (project.tasks || 0),
    0
  );

  const averageProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce(
            (sum, project) => sum + (project.progress || 0),
            0
          ) / projects.length
        )
      : 0;

  const analyticsCards = [
    {
      title: "Total Projects",
      value: projects.length.toString(),
      icon: FolderKanban,
      color: "bg-blue-50 dark:bg-blue-900/30 text-[#0b46bc] dark:text-blue-400",
    },
    {
      title: "Completed Projects",
      value: completedProjects.toString(),
      icon: CheckCircle,
      color: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    },
    {
      title: "Pending Projects",
      value: pendingProjects.toString(),
      icon: Clock,
      color: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    {
      title: "Avg Progress",
      value: `${averageProgress}%`,
      icon: TrendingUp,
      color: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    },
  ];

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Track project progress and team performance."
    >
      {/* TOP CARDS */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {analyticsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${card.color}`}
              >
                <Icon className="w-6 h-6" />
              </div>

              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {card.title}
              </p>

              <h3 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-3">
                {card.value}
              </h3>
            </div>
          );
        })}
      </section>

      {/* PROJECT PROGRESS */}
      <section>
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Project Progress
          </h2>

          <div className="space-y-5">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No projects found.
              </p>
            ) : (
              projects.map((project) => (
                <div key={project._id}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {project.name}
                    </span>
                    <span className="font-bold text-[#0b46bc] dark:text-blue-400">
                      {project.progress || 0}%
                    </span>
                  </div>

                  <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0b46bc] rounded-full"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* WORKLOAD */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 mt-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Workload Summary
        </h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Tasks</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {totalTasks}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Running Projects</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {runningProjects}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Completed Projects</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {completedProjects}
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default Analytics;