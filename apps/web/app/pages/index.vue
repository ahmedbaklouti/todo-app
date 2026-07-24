<script setup lang="ts">
const listsStore = useListsStore();
const tasksStore = useTasksStore();
const authStore = useAuthStore();

async function logout() {
  await authStore.logout();
  await navigateTo('/login');
}

onMounted(async () => {
  await listsStore.fetchLists();
});

watch(
  () => listsStore.selectedListId,
  async (listId) => {
    await tasksStore.fetchTasks(listId);
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <main class="px-6 py-6">
    <header class="mb-6 rounded-3xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
      <p class="text-xs uppercase tracking-[0.25em] text-zinc-400">Todo App</p>
      <div class="mt-3 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-semibold text-zinc-900">Espace de travail</h1>
          <p class="mt-1 text-sm text-zinc-500">
            Listes et taches chargees depuis l'API NestJS securisee par JWT.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
            {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          </div>
          <button
            class="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
            @click="logout"
          >
            Se deconnecter
          </button>
        </div>
      </div>
    </header>

    <section class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <AppSidebar />
      <TaskBoard />
      <TaskDetailPanel />
    </section>
  </main>
</template>
