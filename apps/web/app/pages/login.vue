<script setup lang="ts">
const authStore = useAuthStore();

const mode = ref<'login' | 'register'>('login');
const pending = ref(false);
const errorMessage = ref('');

const loginForm = reactive({
  email: '',
  password: '',
});

const registerForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  emailConfirmation: '',
  password: '',
  passwordConfirmation: '',
});

const isRegisterMode = computed(() => mode.value === 'register');

async function submit() {
  pending.value = true;
  errorMessage.value = '';

  try {
    if (isRegisterMode.value) {
      await authStore.register({ ...registerForm });
    } else {
      await authStore.login({ ...loginForm });
    }

    await navigateTo('/');
  } catch (error) {
    errorMessage.value = useApiErrorMessage(
      error,
      "Une erreur est survenue pendant l'authentification.",
    );
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-6 py-12">
    <div class="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-200/60">
      <div class="mb-8 text-center">
        <p class="text-xs uppercase tracking-[0.3em] text-zinc-400">Libheros</p>
        <h1 class="mt-3 text-3xl font-semibold text-zinc-900">
          {{ isRegisterMode ? 'Creer un compte' : 'Connexion' }}
        </h1>
        <p class="mt-3 text-sm text-zinc-500">
          Authentification connectee au backend NestJS avec access token court et refresh token en cookie `httpOnly`.
        </p>
      </div>

      <div class="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1 text-sm">
        <button
          type="button"
          class="rounded-xl px-4 py-2 transition"
          :class="!isRegisterMode ? 'bg-white font-medium text-zinc-900 shadow-sm' : 'text-zinc-500'"
          @click="mode = 'login'"
        >
          Connexion
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2 transition"
          :class="isRegisterMode ? 'bg-white font-medium text-zinc-900 shadow-sm' : 'text-zinc-500'"
          @click="mode = 'register'"
        >
          Inscription
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <template v-if="isRegisterMode">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-zinc-700">Prenom</span>
              <input
                v-model="registerForm.firstName"
                type="text"
                class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                placeholder="John"
                required
              >
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-zinc-700">Nom</span>
              <input
                v-model="registerForm.lastName"
                type="text"
                class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                placeholder="Doe"
                required
              >
            </label>
          </div>
        </template>

        <label v-if="isRegisterMode" class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Email</span>
          <input
            v-model="registerForm.email"
            type="email"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="john@company.com"
            required
          >
        </label>

        <label v-else class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Email</span>
          <input
            v-model="loginForm.email"
            type="email"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="john@company.com"
            required
          >
        </label>

        <label v-if="isRegisterMode" class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Confirmation email</span>
          <input
            v-model="registerForm.emailConfirmation"
            type="email"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="john@company.com"
            required
          >
        </label>

        <label v-if="isRegisterMode" class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Mot de passe</span>
          <input
            v-model="registerForm.password"
            type="password"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="********"
            required
          >
        </label>

        <label v-else class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Mot de passe</span>
          <input
            v-model="loginForm.password"
            type="password"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="********"
            required
          >
        </label>

        <label v-if="isRegisterMode" class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Confirmation mot de passe</span>
          <input
            v-model="registerForm.passwordConfirmation"
            type="password"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="********"
            required
          >
        </label>

        <p v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMessage }}
        </p>

        <button
          class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          :disabled="pending"
        >
          {{ pending ? 'Chargement...' : isRegisterMode ? 'Creer mon compte' : 'Continuer' }}
        </button>
      </form>
    </div>
  </main>
</template>
