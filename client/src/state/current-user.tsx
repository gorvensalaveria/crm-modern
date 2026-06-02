import { createContext, useContext, useMemo, useState } from "react";
import type { AppUser } from "../types";

type CurrentUserContextValue = {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser) => void;
  clearCurrentUser: () => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

const storageKey = "asun-current-user";

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as AppUser) : null;
  });

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser: (user: AppUser) => {
        localStorage.setItem(storageKey, JSON.stringify(user));
        setUser(user);
      },
      clearCurrentUser: () => {
        localStorage.removeItem(storageKey);
        setUser(null);
      }
    }),
    [currentUser]
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }

  return context;
}
