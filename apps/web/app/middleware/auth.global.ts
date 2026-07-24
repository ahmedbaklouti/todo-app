export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (to.path === '/login') {
    if (!authStore.isAuthenticated) {
      await authStore.restoreSession();
    }

    if (authStore.isAuthenticated) {
      return navigateTo('/');
    }

    return;
  }

  if (!authStore.isAuthenticated) {
    const restored = await authStore.restoreSession();

    if (!restored) {
      return navigateTo('/login');
    }
  }
});
