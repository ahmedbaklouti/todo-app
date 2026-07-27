<script setup lang="ts">
import type { TaskDeletedEvent, TaskItem } from '@todo-app/shared-types';
import AppSidebar from '../components/layout/AppSidebar.vue';
import TaskBoard from '../components/tasks/TaskBoard.vue';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel.vue';

const listsStore = useListsStore();
const tasksStore = useTasksStore();
const authStore = useAuthStore();
const { $socket } = useNuxtApp();
const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);

const userFullName = computed(() => {
  if (!authStore.user) {
    return 'Mon espace';
  }

  return `${authStore.user.firstName} ${authStore.user.lastName}`;
});

const userInitials = computed(() => {
  if (!authStore.user) {
    return 'ME';
  }

  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName.charAt(0)}`
    .toUpperCase();
});

const selectedListName = computed(
  () => listsStore.items.find((item) => item.id === listsStore.selectedListId)?.name ?? null,
);

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`;
}

const workspaceSummary = computed(() => {
  if (!selectedListName.value) {
    return 'Aucune liste selectionnee pour le moment.';
  }

  return `${formatCount(tasksStore.activeTasks.length, 'tache')} en cours et ${formatCount(tasksStore.completedTasks.length, 'tache')} terminee${tasksStore.completedTasks.length > 1 ? 's' : ''} dans "${selectedListName.value}".`;
});

const dashboardLayoutClass = computed(() => {
  if (sidebarCollapsed.value) {
    return tasksStore.selectedTaskId
      ? 'xl:grid-cols-[88px_minmax(0,1fr)_320px]'
      : 'xl:grid-cols-[88px_minmax(0,1fr)]';
  }

  return tasksStore.selectedTaskId
    ? 'xl:grid-cols-[280px_minmax(0,1fr)_320px]'
    : 'xl:grid-cols-[280px_minmax(0,1fr)]';
});

async function logout() {
  await authStore.logout();
  await navigateTo('/login');
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false;
}

function joinListRoom(listId: string | null) {
  if (!listId || !$socket.connected) {
    return;
  }

  $socket.emit('list:join', { listId });
}

function leaveListRoom(listId: string | null) {
  if (!listId || !$socket.connected) {
    return;
  }

  $socket.emit('list:leave', { listId });
}

function syncSocketConnection(accessToken: string | null) {
  if (!accessToken) {
    if ($socket.connected) {
      $socket.disconnect();
    }

    return;
  }

  $socket.auth = { token: accessToken };

  if ($socket.connected) {
    $socket.disconnect();
  }

  $socket.connect();
}

function handleTaskCreated(task: TaskItem) {
  tasksStore.upsertTask(task);
}

function handleTaskUpdated(task: TaskItem) {
  tasksStore.upsertTask(task);
}

function handleTaskCompleted(task: TaskItem) {
  tasksStore.upsertTask(task);
}

function handleTaskDeleted(event: TaskDeletedEvent) {
  tasksStore.applyTaskDeleted(event);
}

onMounted(async () => {
  $socket.on('connect', () => {
    joinListRoom(listsStore.selectedListId);
  });
  $socket.on('task:created', handleTaskCreated);
  $socket.on('task:updated', handleTaskUpdated);
  $socket.on('task:completed', handleTaskCompleted);
  $socket.on('task:deleted', handleTaskDeleted);

  syncSocketConnection(authStore.accessToken);
  await listsStore.fetchLists();
});

onBeforeUnmount(() => {
  leaveListRoom(listsStore.selectedListId);
  $socket.off('task:created', handleTaskCreated);
  $socket.off('task:updated', handleTaskUpdated);
  $socket.off('task:completed', handleTaskCompleted);
  $socket.off('task:deleted', handleTaskDeleted);
  $socket.off('connect');
});

watch(
  () => authStore.accessToken,
  (accessToken) => {
    syncSocketConnection(accessToken);
  },
);

watch(
  () => listsStore.selectedListId,
  async (listId, previousListId) => {
    leaveListRoom(previousListId ?? null);
    joinListRoom(listId);
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
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-[0.25em] text-zinc-400">Todo App</p>
          <h1 class="mt-3 text-3xl font-semibold text-zinc-900">Espace de travail</h1>
          <p class="mt-1 text-sm text-zinc-500">
            Pilote tes listes et tes taches depuis une interface connectee a l'API NestJS securisee par JWT.
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
              {{ formatCount(listsStore.items.length, 'liste') }}
            </span>
            <span class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              {{ formatCount(tasksStore.activeTasks.length, 'tache') }} en cours
            </span>
            <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              {{ formatCount(tasksStore.completedTasks.length, 'tache') }} terminee{{ tasksStore.completedTasks.length > 1 ? 's' : '' }}
            </span>
          </div>

          <p class="mt-3 text-sm text-zinc-500">
            {{ workspaceSummary }}
          </p>
        </div>

        <div class="flex flex-col gap-3 xl:min-w-[320px] xl:items-end">
          <div class="flex flex-wrap items-center gap-3 self-stretch xl:justify-end">
            <button
              class="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 xl:hidden"
              @click="mobileSidebarOpen = true"
            >
              Mes listes
            </button>
            <button
              class="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
              @click="logout"
            >
              Se deconnecter
            </button>
          </div>

          <div class="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div class="flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
              {{ userInitials }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-zinc-900">
                {{ userFullName }}
              </p>
              <p class="truncate text-sm text-zinc-500">
                {{ authStore.user?.email }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <section class="grid gap-6" :class="dashboardLayoutClass">
      <AppSidebar
        class="hidden xl:flex"
        :collapsed="sidebarCollapsed"
        :show-toggle="true"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
        @select="closeMobileSidebar"
      />
      <TaskBoard />
      <TaskDetailPanel v-if="tasksStore.selectedTaskId" />
    </section>

    <Teleport to="body">
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-0 z-40 bg-zinc-950/45 xl:hidden"
        @click.self="closeMobileSidebar"
      >
        <div class="ml-auto h-full w-full max-w-sm p-4">
          <div class="mb-3 flex items-center justify-end">
            <button
              class="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-zinc-900"
              @click="closeMobileSidebar"
            >
              Fermer
            </button>
          </div>
          <AppSidebar
            :collapsed="false"
            :show-toggle="false"
            @select="closeMobileSidebar"
          />
        </div>
      </div>
    </Teleport>
  </main>
</template>
