import { useSyncExternalStore, useEffect } from "react";
import {
  subscribe,
  getProjects,
  hasLoaded,
  fetchProjects,
} from "../data/projectStore";

export function useProjects() {
  const projects = useSyncExternalStore(subscribe, getProjects, getProjects);
  const loaded = useSyncExternalStore(subscribe, hasLoaded, hasLoaded);

  useEffect(() => {
    // Always revalidate in the background; UI shows existing data instantly.
    void fetchProjects();
  }, []);

  return { projects, loaded };
}