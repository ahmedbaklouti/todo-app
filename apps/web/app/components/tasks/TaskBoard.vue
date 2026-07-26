<script setup lang="ts">
const listsStore = useListsStore();
const tasksStore = useTasksStore();

const pending = ref(false);
const errorMessage = ref('');

const taskForm = reactive({
  shortDescription: '',
  longDescription: '',
  dueDate: '',
});

const selectedList = computed(
  () => listsStore.items.find((item) => item.id === listsStore.selectedListId) ?? null,
);

async function createTask() {
  if (!selectedList.value) {
    errorMessage.value = 'Selectionne une liste avant de creer une tache.';
    return;
  }

  if (!taskForm.shortDescription.trim()) {
    errorMessage.value = 'La description courte est obligatoire.';
    return;
  }

  if (!taskForm.dueDate) {
    errorMessage.value = "La date d'echeance est obligatoire.";
    return;
  }

  pending.value = true;
  errorMessage.value = '';

  try {
    await tasksStore.createTask({
      listId: selectedList.value.id,
      shortDescription: taskForm.shortDescription.trim(),
      longDescription: taskForm.longDescription.trim() || undefined,
      dueDate: taskForm.dueDate,
    });

    taskForm.shortDescription = '';
    taskForm.longDescription = '';
    taskForm.dueDate = '';
  } catch (error) {
    errorMessage.value = useApiErrorMessage(
      error,
      'Impossible de creer la tache.',
    );
  } finally {
    pending.value = false;
  }
}

async function toggleTask(taskId: string, completed: boolean) {
  await tasksStore.toggleTaskStatus(taskId, completed);
}

watchEffect(() => {
  if (taskForm.shortDescription.trim() && taskForm.dueDate) {
    errorMessage.value = '';
  }
});
</script>

<template>
  <section class="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-end justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Taches</p>
        <h2 class="text-2xl font-semibold text-zinc-900">
          {{ selectedList?.name ?? 'Liste active' }}
        </h2>
      </div>
    </div>

    <div v-if="!selectedList" class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
      Selectionne une liste puis ajoute ta premiere tache.
    </div>

    <div v-else class="space-y-6">
      <form class="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4" @submit.prevent="createTask">
        <input
          v-model="taskForm.shortDescription"
          type="text"
          class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          placeholder="Description courte"
        >
        <textarea
          v-model="taskForm.longDescription"
          class="min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          placeholder="Description longue optionnelle"
        />
        <div class="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            v-model="taskForm.dueDate"
            type="date"
            class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          >
          <button
            class="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            :disabled="pending"
          >
            {{ pending ? 'Creation...' : 'Ajouter une tache' }}
          </button>
        </div>
        <p v-if="errorMessage" class="text-sm text-rose-600">
          {{ errorMessage }}
        </p>
      </form>

      <div v-if="tasksStore.activeTasks.length === 0" class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
        Aucune tache active sur cette liste.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="task in tasksStore.activeTasks"
          :key="task.id"
          class="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/30"
        >
          <button
            class="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-2 py-2 text-left transition hover:bg-white/80"
            @click="tasksStore.selectTask(task.id)"
          >
            <span
              class="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
            >
              En cours
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-zinc-900">
                {{ task.shortDescription }}
              </span>
              <span class="mt-1 inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                Echeance {{ task.dueDate.slice(0, 10) }}
              </span>
            </span>
          </button>

          <button
            class="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            @click="toggleTask(task.id, true)"
          >
            Terminer
          </button>
        </div>
      </div>

      <details class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <summary class="cursor-pointer text-sm font-medium text-zinc-700">
          Mes taches terminees ({{ tasksStore.completedTasks.length }})
        </summary>

        <div class="mt-4 space-y-2">
          <div
            v-for="task in tasksStore.completedTasks"
            :key="task.id"
            class="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <div class="min-w-0">
              <p class="truncate font-medium">{{ task.shortDescription }}</p>
              <p class="mt-1 text-xs text-emerald-700/80">
                Echeance {{ task.dueDate.slice(0, 10) }}
              </p>
            </div>
            <button
              class="shrink-0 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
              @click="toggleTask(task.id, false)"
            >
              Reouvrir
            </button>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>
