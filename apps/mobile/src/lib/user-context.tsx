import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "@jingles/shared";

interface UserContextValue {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  otherUser: User | null;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const otherUser =
    currentUser && users.length === 2
      ? (users.find((u) => u.id !== currentUser.id) ?? null)
      : null;

  return (
    <UserContext.Provider
      value={{ users, setUsers, currentUser, setCurrentUser, otherUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
