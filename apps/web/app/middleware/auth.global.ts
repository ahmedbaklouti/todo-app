export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  if (to.path === '/login') {
    return;
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }
});
