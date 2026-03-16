import React, { createContext, useContext, useState } from "react";

export interface FormData {
  name: string;
  studentId: string;
  department: string;
  position: string;
}

export interface Shift {
  id: string;
  week: "单周" | "双周";
  day: string;
  time: string;
}

interface ScheduleContextType {
  formData: FormData;
  setFormData: (data: FormData) => void;
  selectedShifts: Shift[];
  toggleShift: (shift: Omit<Shift, "id">) => void;
  reorderShifts: (shifts: Shift[]) => void;
  isShiftSelected: (week: string, day: string, time: string) => boolean;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    studentId: "",
    department: "",
    position: "",
  });
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleShift = (shift: Omit<Shift, "id">) => {
    const id = `${shift.week}-${shift.day}-${shift.time}`;
    setSelectedShifts((prev) => {
      const exists = prev.find((s) => s.id === id);
      if (exists) {
        return prev.filter((s) => s.id !== id);
      } else {
        return [...prev, { ...shift, id }];
      }
    });
  };

  const isShiftSelected = (week: string, day: string, time: string) => {
    const id = `${week}-${day}-${time}`;
    return selectedShifts.some((s) => s.id === id);
  };

  const reorderShifts = (shifts: Shift[]) => {
    setSelectedShifts(shifts);
  };

  return (
    <ScheduleContext.Provider
      value={{
        formData,
        setFormData,
        selectedShifts,
        toggleShift,
        reorderShifts,
        isShiftSelected,
        submitted,
        setSubmitted,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}
