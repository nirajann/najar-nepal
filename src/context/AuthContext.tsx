import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { api } from "../services/api";

export type User = {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  district?: string;
  province?: string;
  birthplace?: string;
  bio?: string;
  profilePhoto?: string;
  role?: "user" | "admin" | "reviewer";
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected";
  verificationNotes?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  badges?: string[];
};

type LoginResponse = {
  token: string;
  user: User;
};

export type AuthContextType = {
  user: User | null;
  token: string;
  isAuthenticated: boolean;
  authReady: boolean;
  loginUser: (email: string, password: string) => Promise<LoginResponse>;
  logoutUser: () => void;
  handleUnauthorized: () => void;
  updateUser: (nextUser: Partial<User>) => void;
  setUser: Dispatch<SetStateAction<User | null>>;
  setToken: Dispatch<SetStateAction<string>>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as User);
      } catch {
        localStorage.removeItem("user");
      }
    }

    setAuthReady(true);
  }, []);

  const handleUnauthorized = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
    const res = (await api.login(email, password)) as LoginResponse;

    const nextToken = res.token || "";
    const nextUser = res.user || null;

    if (!nextToken || !nextUser) {
      throw new Error("Login response is missing token or user");
    }

    setToken(nextToken);
    setUser(nextUser);

    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));

    return res;
  };

  const logoutUser = () => {
    handleUnauthorized();
  };

  const updateUser = (nextUser: Partial<User>) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...nextUser };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      authReady,
      loginUser,
      logoutUser,
      handleUnauthorized,
      updateUser,
      setUser,
      setToken,
    }),
    [user, token, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}