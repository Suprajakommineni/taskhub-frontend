export type ProjectStatus =
  | "Pending"
  | "Running"
  | "Completed";

export type Priority =
  | "Low"
  | "Medium"
  | "High";

export interface Member {
  username: string;
  avatar: string;
}

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  tasks: number;
  dueDate: string;
  members: Member[];
};