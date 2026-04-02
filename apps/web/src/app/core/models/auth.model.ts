export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string | null;
  isAuthenticated: boolean;
}