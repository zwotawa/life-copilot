import { CurrentUser } from "../auth.model";

export interface AuthResponse {
    user: CurrentUser | null,
    accessToken: string | null
}