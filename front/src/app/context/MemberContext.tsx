import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Member } from "../data/mockData";

// ─── localStorage key ─────────────────────────────────────────────────────────
const STORAGE_KEY = "volunteer-scheduling-members";

// ─── Context type ─────────────────────────────────────────────────────────────
interface MemberContextType {
  allMembers: Member[];
  /** Replace the entire member list with newly imported members */
  importMembers: (members: Member[]) => void;
  /** Append new members (skip duplicates by studentId) */
  appendMembers: (members: Member[]) => void;
  /** Update a single member (e.g. after shift submission) */
  updateMember: (id: string, patch: Partial<Member>) => void;
}

const MemberContext = createContext<MemberContextType | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadFromStorage(): Member[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(members: Member[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    // storage full, ignore
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MemberProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const [members, setMembers] = useState<Member[]>(stored ?? []);

  const importMembers = useCallback((newMembers: Member[]) => {
    setMembers(newMembers);
    saveToStorage(newMembers);
  }, []);

  const appendMembers = useCallback((newMembers: Member[]) => {
    setMembers((prev) => {
      const existingIds = new Set(prev.map((m) => m.studentId));
      const toAdd = newMembers.filter((m) => !existingIds.has(m.studentId));
      const updated = [...prev, ...toAdd];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateMember = useCallback((id: string, patch: Partial<Member>) => {
    setMembers((prev) => {
      const updated = prev.map((m) => (m.studentId === id ? { ...m, ...patch } : m));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return (
    <MemberContext.Provider
      value={{ allMembers: members, importMembers, appendMembers, updateMember }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMembers() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMembers must be used within MemberProvider");
  return ctx;
}
