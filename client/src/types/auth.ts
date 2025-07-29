export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "collector";
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
