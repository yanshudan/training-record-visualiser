// Authentication / identity context. The whole app is keyed by `userId`, so
// multi-user works regardless of storage backend. Today the identity is a local
// profile (and an optional bearer token for backend mode); swapping in real
// auth (Entra ID / MSAL) later only means populating this context from the IdP.

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export interface UserProfile {
  userId: string;
  displayName: string;
  /** Bearer token for backend mode; undefined in local/SAS mode. */
  token?: string;
}

interface AuthContextValue {
  profile: UserProfile;
  signIn: (profile: UserProfile) => void;
  signOut: () => void;
  getToken: () => string | undefined;
}

const PROFILE_KEY = "trv:profile";

function loadProfile(): UserProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      /* ignore */
    }
  }
  const userId = import.meta.env.VITE_SAS_USER_ID || "me";
  return { userId, displayName: userId };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  const signIn = useCallback((next: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(loadProfile());
  }, []);

  const getToken = useCallback(() => profile.token, [profile.token]);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, signIn, signOut, getToken }),
    [profile, signIn, signOut, getToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
