<script setup lang="ts">
import type { TaskItem, TaskList } from '@todo-app/shared-types';

const listsStore = useListsStore();
const tasksStore = useTasksStore();
const authStore = useAuthStore();
const currentUserId = authStore.user?.id ?? 'user-session';

const demoLists: TaskList[] = [
  {
    id: 'list-1',
    userId: currentUserId,
    name: 'Recrutement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'list-2',
    userId: currentUserId,
    name: 'Produit',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoTasks: TaskItem[] = [
  {
    id: 'task-1',
    listId: 'list-1',
    shortDescription: 'Preparer la restitution du test technique',
    longDescription: 'Finaliser le monorepo, la documentation et le plan de livraison.',
    dueDate: '2026-07-30',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    listId: 'list-1',
    shortDescription: 'Partager le repository GitHub',
    longDescription: 'Verifier README, CI et docker-compose avant partage.',
    dueDate: '2026-07-31',
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

listsStore.setLists(demoLists);
listsStore.selectList(demoLists[0]?.id ?? null);
tasksStore.setTasks(demoTasks);

async function logout() {
  await authStore.logout();
  await navigateTo('/login');
}
</script>

<template>
  <main class="px-6 py-6">
    <header class="mb-6 rounded-3xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
      <p class="text-xs uppercase tracking-[0.25em] text-zinc-400">Todo App</p>
      <div class="mt-3 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-semibold text-zinc-900">Espace de travail</h1>
          <p class="mt-1 text-sm text-zinc-500">
            Session restauree via refresh token, en attendant le branchement complet des CRUD listes et taches.
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
