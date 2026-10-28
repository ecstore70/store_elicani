/**
 * Estado compartilhado entre a server action de login/signup e os formulários.
 */
export type AuthState = {
  error: string | null;
  notice: string | null;
};

export const INITIAL_AUTH_STATE: AuthState = { error: null, notice: null };
