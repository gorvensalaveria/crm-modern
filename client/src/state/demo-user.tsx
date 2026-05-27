import { createContext, useContext, useMemo, useState } from "react";
import type { DemoUser } from "../types";

type DemoUserContextValue = {
  currentUser: DemoUser | null;
  setCurrentUser: (user: DemoUser) => void;
  clearCurrentUser: () => void;
};

const DemoUserContext = createContext<DemoUserContextValue | null>(null);

const storageKey = "asun-demo-user";

export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setUser] = useState<DemoUser | null>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as DemoUser) : null;
  });

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser: (user: DemoUser) => {
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

  return <DemoUserContext.Provider value={value}>{children}</DemoUserContext.Provider>;
}

export function useDemoUser() {
  const context = useContext(DemoUserContext);

  if (!context) {
    throw new Error("useDemoUser must be used inside DemoUserProvider");
  }

  return context;
}

