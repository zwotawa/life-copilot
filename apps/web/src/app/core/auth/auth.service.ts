import { CurrentUser } from "../models/auth.model";

export abstract class AuthService {
  abstract getCurrentUser(): CurrentUser | null;
  abstract isAuthenticated(): boolean;
  abstract signIn(email: string, password: string): Promise<CurrentUser>;
  abstract signOut(): Promise<void>;
  abstract restoreSession(): Promise<CurrentUser | null>;
  abstract getAccessToken(): string | null;
  abstract isSignedIn(): boolean;
}