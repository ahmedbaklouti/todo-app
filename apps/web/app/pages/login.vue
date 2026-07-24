<script setup lang="ts">
const authStore = useAuthStore();

function demoLogin() {
  authStore.setSession(
    {
      id: 'demo-user',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@libheros.local',
    },
    'demo-token',
  );

  return navigateTo('/');
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-6 py-12">
    <div class="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-200/60">
      <div class="mb-8 text-center">
        <p class="text-xs uppercase tracking-[0.3em] text-zinc-400">Libheros</p>
        <h1 class="mt-3 text-3xl font-semibold text-zinc-900">Connexion</h1>
        <p class="mt-3 text-sm text-zinc-500">
          Base UI Nuxt pour le test technique, avec structure prete pour auth JWT et refresh token.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="demoLogin">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Email</span>
          <input
            type="email"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="john@company.com"
          >
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Mot de passe</span>
          <input
            type="password"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="••••••••"
          >
        </label>

        <button class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700">
          Continuer
        </button>
      </form>
    </div>
  </main>
</template>
