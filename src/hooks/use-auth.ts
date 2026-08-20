import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";

export const ADMIN_ROLE = "admin";

const TOKEN_KEY = "tpd-admin-token";

export interface AuthUser {
  name: string;
  role: "admin";
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * ผู้ใช้งาน 2 แบบ:
 * 1. เว็บทั่วไป — เปิดดูกฎได้เลย ไม่ต้องเข้าสู่ระบบ
 * 2. ผู้ดูแลระบบ (Admin) — เข้าสู่ระบบด้วย ID admin + รหัสผ่าน (88888888)
 */
export function useAuth() {
  const login = useMutation(api.rules.adminLogin);
  const logout = useMutation(api.rules.adminLogout);
  const [token, setToken] = useState<string | null>(() => readToken());

  // ตรวจว่า token ที่เก็บไว้ยังใช้ได้หรือไม่ (เซสชันหมดอายุ / ถูกลบ)
  const session = useQuery(api.rules.me, token ? { token } : "skip");

  const isLoading = token !== null && session === undefined;
  const isAuthenticated = token !== null && session !== null;

  const signIn = useCallback(
    async (username: string, password: string) => {
      const result = await login({ username, password });
      try {
        localStorage.setItem(TOKEN_KEY, result.token);
      } catch {
        // localStorage ไม่พร้อมใช้งาน — session อยู่แค่ในหน่วยความจำ
      }
      setToken(result.token);
    },
    [login],
  );

  const signOut = useCallback(async () => {
    const current = token;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    if (current) {
      // ลบ session ฝั่งเซิร์ฟเวอร์ (เผื่อ error ก็ตัด session ฝั่ง client แล้ว)
      logout({ token: current }).catch(() => {});
    }
  }, [token, logout]);

  return {
    isLoading,
    isAuthenticated,
    user: isAuthenticated ? ({ name: "admin", role: ADMIN_ROLE } satisfies AuthUser) : null,
    token,
    signIn,
    signOut,
  };
}
