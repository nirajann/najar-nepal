import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";

type User = {
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
  role?: string;
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected";
  citizenshipNumber?: string;
  badges?: string[];
};

type AuthContextType = {
  user: User | null;
  token: string;
  isAuthenticated: boolean;
  authReady: boolean;
  loginUser: (email: string, password: string) => Promise<any>;
  logoutUser: () => void;
  handleUnauthorized: () => void;
  updateUser: (nextUser: Partial<User>) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: React.Dispatch<React.SetStateAction<string>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        setUser(JSON.parse(savedUser));
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

  const loginUser = async (email: string, password: string) => {
    const res = await api.login(email, password);

    const nextToken = res?.token || "";
    const nextUser = res?.user || null;

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

  const value = useMemo(
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}