import type { AuthSession, AuthUser } from '@todo-app/shared-types';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmation: string;
  password: string;
  passwordConfirmation: string;
};

let refreshSessionPromise: Promise<boolean> | null = null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
    restoreAttempted: false,
    isRestoring: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && state.accessToken),
  },
  actions: {
    setSession(session: AuthSession) {
      this.user = session.user;
      this.accessToken = session.accessToken;
      this.restoreAttempted = true;
    },
    clearSession() {
      this.user = null;
      this.accessToken = null;
    },
    async login(payload: LoginPayload) {
      const session = await useApiFetch<AuthSession>('/auth/login', {
        method: 'POST',
        body: payload,
        skipAuthRefresh: true,
      });

      this.setSession(session);
    },
    async register(payload: RegisterPayload) {
      const session = await useApiFetch<AuthSession>('/auth/register', {
        method: 'POST',
        body: payload,
        skipAuthRefresh: true,
      });

      this.setSession(session);
    },
    async refreshSession() {
      if (refreshSessionPromise) {
        return refreshSessionPromise;
      }

      this.isRestoring = true;

      refreshSessionPromise = (async () => {
        try {
          const session = await useApiFetch<AuthSession>('/auth/refresh', {
            method: 'POST',
            skipAuthRefresh: true,
          });

          this.setSession(session);
          return true;
        } catch {
          this.clearSession();
          return false;
        } finally {
          this.restoreAttempted = true;
          this.isRestoring = false;
          refreshSessionPromise = null;
        }
      })();

      return refreshSessionPromise;
    },
    async restoreSession() {
      if (this.isAuthenticated) {
        return true;
      }

      if (this.restoreAttempted) {
        return false;
      }

      return this.refreshSession();
    },
    async logout() {
      try {
        await useApiFetch('/auth/logout', {
          method: 'POST',
          skipAuthRefresh: true,
        });
      } finally {
        this.clearSession();
        this.restoreAttempted = true;
      }
    },
  },
});
