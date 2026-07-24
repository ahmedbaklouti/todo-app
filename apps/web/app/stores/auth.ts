import type { AuthUser } from '@todo-app/shared-types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && state.accessToken),
  },
  actions: {
    setSession(user: AuthUser, accessToken: string) {
      this.user = user;
      this.accessToken = accessToken;
    },
    clearSession() {
      this.user = null;
      this.accessToken = null;
    },
  },
});
