import { createContext, useContext, useState, type ReactNode } from "react";

interface GuestViewValue {
  /** ผู้ดูแลกำลังดูเว็บในมุมมองผู้เยี่ยมชม (อ่านอย่างเดียว) หรือไม่ */
  guestView: boolean;
  toggleGuestView: () => void;
  setGuestView: (value: boolean) => void;
}

const GuestViewContext = createContext<GuestViewValue | null>(null);

const STORAGE_KEY = "tpd-guest-view";

export function GuestViewProvider({ children }: { children: ReactNode }) {
  const [guestView, setGuestView] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleGuestView = () =>
    setGuestView((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // localStorage ไม่พร้อมใช้งาน — ไม่เป็นไร
      }
      return next;
    });

  return (
    <GuestViewContext.Provider value={{ guestView, toggleGuestView, setGuestView }}>
      {children}
    </GuestViewContext.Provider>
  );
}

export function useGuestView() {
  const context = useContext(GuestViewContext);
  if (!context) throw new Error("useGuestView ต้องใช้ภายใน GuestViewProvider");
  return context;
}
