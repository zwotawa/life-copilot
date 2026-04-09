import { Observable } from "rxjs";
import { CurrentUser } from "../models/auth.model";
import { AuthResponse } from "../models/api/api-auth-response.model";
import { RegisterRequest } from "../models/api/api-register-request.model";

export abstract class AuthService {
  abstract getCurrentUser(): CurrentUser | null;
  abstract isAuthenticated(): boolean;
  abstract signIn(email: string, password: string): Promise<CurrentUser>;
  abstract signOut(): Promise<void>;
  abstract restoreSession(): Promise<CurrentUser | null>;
  abstract getAccessToken(): string | null;
  abstract isSignedIn(): boolean;
  abstract register(req: RegisterRequest): Observable<AuthResponse>;
}