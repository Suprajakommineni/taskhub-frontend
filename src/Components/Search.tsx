import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

const SearchContext = createContext<{
  search: string;
  setSearch: (value: string) => void;
} | null>(null);
export function SearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      {children}
    </SearchContext.Provider>
  );
}
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used within a SearchProvider");
  return context;
}
// Place this component INSIDE your Router in App.tsx
export function SearchResetter() {
  const { setSearch } = useSearch();
  const location = useLocation();
  useEffect(() => {
    setSearch("");
  }, [location.pathname]);
  return null;
}