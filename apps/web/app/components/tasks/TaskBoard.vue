<script setup lang="ts">
const listsStore = useListsStore();
const tasksStore = useTasksStore();

const pending = ref(false);
const errorMessage = ref('');
const fieldErrors = reactive({
  shortDescription: '',
  dueDate: '',
});

const taskForm = reactive({
  shortDescription: '',
  longDescription: '',
  dueDate: '',
});

const selectedList = computed(
  () => listsStore.items.find((item) => item.id === listsStore.selectedListId) ?? null,
);

const activeTaskCount = computed(() => tasksStore.activeTasks.length);
const completedTaskCount = computed(() => tasksStore.completedTasks.length);

async function retryTasksFetch() {
  await tasksStore.fetchTasks(selectedList.value?.id ?? null);
}

async function createTask() {
  if (!selectedList.value) {
    errorMessage.value = 'Selectionne une liste avant de creer une tache.';
    return;
  }

  fieldErrors.shortDescription = '';
  fieldErrors.dueDate = '';

  if (!taskForm.shortDescription.trim()) {
    fieldErrors.shortDescription = 'La description courte est obligatoire.';
  }

  if (!taskForm.dueDate) {
    fieldErrors.dueDate = "La date d'echeance est obligatoire.";
  }

  if (fieldErrors.shortDescription || fieldErrors.dueDate) {
    errorMessage.value = 'Complete les champs obligatoires avant de creer la tache.';
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
  if (
    !fieldErrors.shortDescription &&
    !fieldErrors.dueDate &&
    taskForm.shortDescription.trim() &&
    taskForm.dueDate
  ) {
    errorMessage.value = '';
  }
});

watch(
  () => taskForm.shortDescription,
  (value) => {
    if (value.trim()) {
      fieldErrors.shortDescription = '';
    }
  },
);

watch(
  () => taskForm.dueDate,
  (value) => {
    if (value) {
      fieldErrors.dueDate = '';
    }
  },
);
</script>

<template>
  <section
    class="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
    :aria-busy="tasksStore.isLoading"
  >
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="min-w-0">
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Taches</p>
        <h2 class="text-2xl font-semibold text-zinc-900">
          {{ selectedList?.name ?? 'Aucune liste selectionnee' }}
        </h2>
        <p class="mt-1 text-sm text-zinc-500">
          {{
            selectedList
              ? 'Retrouve les taches actives, les details et les actions de suivi de cette liste.'
              : 'Selectionne une liste pour afficher ses taches et commencer a travailler.'
          }}
        </p>
      </div>

      <div
        v-if="selectedList"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          {{ activeTaskCount }} en cours
        </span>
        <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          {{ completedTaskCount }} terminees
        </span>
      </div>
    </div>

    <div v-if="!selectedList" class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
      Selectionne une liste puis ajoute ta premiere tache.
    </div>

    <div v-else class="space-y-6">
      <form class="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4" @submit.prevent="createTask">
        <div class="flex flex-col gap-1">
          <h3 class="text-sm font-semibold text-zinc-900">Ajouter une nouvelle tache</h3>
          <p class="text-sm text-zinc-500">
            Renseigne l'essentiel pour suivre la tache et retrouver facilement son echeance.
          </p>
        </div>
        <input
          v-model="taskForm.shortDescription"
          type="text"
          class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          :class="fieldErrors.shortDescription ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200'"
          placeholder="Ex : Contacter le candidat"
          required
          :aria-invalid="Boolean(fieldErrors.shortDescription)"
          :disabled="pending || tasksStore.isLoading"
        >
        <p v-if="fieldErrors.shortDescription" class="text-sm text-rose-600">
          {{ fieldErrors.shortDescription }}
        </p>
        <textarea
          v-model="taskForm.longDescription"
          class="min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          placeholder="Ajoute un contexte utile, des notes ou la prochaine action."
          :disabled="pending || tasksStore.isLoading"
        />
        <div class="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            v-model="taskForm.dueDate"
            type="date"
            class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            :class="fieldErrors.dueDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200'"
            required
            :aria-invalid="Boolean(fieldErrors.dueDate)"
            :disabled="pending || tasksStore.isLoading"
          >
          <button
            class="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            :disabled="pending || tasksStore.isLoading"
          >
            {{ pending ? 'Creation en cours...' : 'Ajouter la tache' }}
          </button>
        </div>
        <p v-if="fieldErrors.dueDate" class="text-sm text-rose-600">
          {{ fieldErrors.dueDate }}
        </p>
        <p v-if="errorMessage" class="text-sm text-rose-600">
          {{ errorMessage }}
        </p>
      </form>

      <div
        v-if="tasksStore.errorMessage"
        class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5"
      >
        <p class="text-sm font-medium text-rose-700">{{ tasksStore.errorMessage }}</p>
        <button
          type="button"
          class="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
          @click="retryTasksFetch"
        >
          Recharger les taches
        </button>
      </div>

      <div v-else-if="tasksStore.isLoading" class="space-y-3">
        <div
          v-for="index in 3"
          :key="index"
          class="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div class="h-4 w-24 rounded bg-zinc-200" />
          <div class="mt-3 h-4 w-2/3 rounded bg-zinc-200" />
          <div class="mt-3 h-3 w-28 rounded bg-zinc-200" />
        </div>
      </div>

      <div v-else-if="tasksStore.activeTasks.length === 0" class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
        Aucune tache active sur cette liste.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="task in tasksStore.activeTasks"
          :key="task.id"
          class="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/30"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-2 py-2 text-left transition hover:bg-white/80"
            :aria-label="`Ouvrir le detail de la tache ${task.shortDescription}`"
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
            type="button"
            class="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            :aria-label="`Marquer la tache ${task.shortDescription} comme terminee`"
            @click="toggleTask(task.id, true)"
          >
            Terminer
          </button>
        </div>
      </div>

      <details class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <summary class="cursor-pointer list-none">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span class="text-sm font-medium text-zinc-700">
              Mes tâches terminées ({{ completedTaskCount }})
            </span>
            <span class="text-xs text-zinc-500">
              Reouvre une tache si elle doit revenir dans le flux actif.
            </span>
          </div>
        </summary>

        <div class="mt-4 space-y-2">
          <div
            v-if="completedTaskCount === 0"
            class="rounded-2xl border border-dashed border-emerald-200 bg-white px-4 py-6 text-center text-sm text-zinc-500"
          >
            Aucune tache terminee pour le moment.
          </div>

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
              type="button"
              class="shrink-0 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
              :aria-label="`Reouvrir la tache ${task.shortDescription}`"
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
