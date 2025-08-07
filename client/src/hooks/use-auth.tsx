import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, type User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  register: (name: string, email: string, department: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (currentUser && typeof currentUser === 'object' && 'user' in currentUser) {
      setUser((currentUser as any).user);
    }
  }, [currentUser]);

  const loginMutation = useMutation({
    mutationFn: (email: string) => auth.login({ email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => 
      auth.verify({ email, code }),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ name, email, department }: { name: string; email: string; department: string }) =>
      auth.register({ name, email, department }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => auth.logout(),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });

  const value = {
    user,
    isLoading,
    login: (email: string) => loginMutation.mutateAsync(email),
    verify: (email: string, code: string) => verifyMutation.mutateAsync({ email, code }),
    register: (name: string, email: string, department: string) => 
      registerMutation.mutateAsync({ name, email, department }),
    logout: () => logoutMutation.mutateAsync(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
