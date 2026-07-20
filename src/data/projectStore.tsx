import projectApi from "../api/projectapi";

export interface StoreProject {
  _id?: string;
  id?: string;
  name: string;
  status?: string;
  priority?: string;
  progress?: number;
  tasks?: number;
  dueDate?: string;
  members?: { username: string; avatar: string }[];
}

let projects: StoreProject[] = [];
let loaded = false;
let inFlight: Promise<StoreProject[]> | null = null;
const listeners = new Set<() => void>();

export const getProjects = () => projects;
export const hasLoaded = () => loaded;

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit() {
  listeners.forEach((cb) => cb());
}

// Deduped fetch: concurrent callers share one request.
export function fetchProjects(force = false): Promise<StoreProject[]> {
  if (inFlight && !force) return inFlight;
  inFlight = projectApi
    .get("/")
    .then((res) => {
      projects = Array.isArray(res.data) ? res.data : [];
      loaded = true;
      emit();
      return projects;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

// Let pages update the store optimistically (create / edit / delete).
export function setProjects(next: StoreProject[]) {
  projects = next;
  loaded = true;
  emit();
}