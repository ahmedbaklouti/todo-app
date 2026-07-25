<script setup lang="ts">
const tasksStore = useTasksStore();
const pending = ref(false);
const errorMessage = ref('');

const selectedTask = computed(() =>
  tasksStore.items.find((task) => task.id === tasksStore.selectedTaskId) ?? null,
);

const editForm = reactive({
  shortDescription: '',
  longDescription: '',
  dueDate: '',
});

watch(
  selectedTask,
  (task) => {
    editForm.shortDescription = task?.shortDescription ?? '';
    editForm.longDescription = task?.longDescription ?? '';
    editForm.dueDate = task?.dueDate.slice(0, 10) ?? '';
    errorMessage.value = '';
  },
  { immediate: true },
);

async function saveTask() {
  if (!selectedTask.value) {
    return;
  }

  pending.value = true;
  errorMessage.value = '';

  try {
    await tasksStore.updateTask(selectedTask.value.id, {
      shortDescription: editForm.shortDescription.trim(),
      longDescription: editForm.longDescription.trim(),
      dueDate: editForm.dueDate,
    });
  } catch (error) {
    errorMessage.value =
      typeof error === 'object' &&
      error !== null &&
      'data' in error &&
      typeof error.data === 'object' &&
      error.data !== null &&
      'message' in error.data
        ? String(error.data.message)
        : 'Impossible de mettre a jour la tache.';
  } finally {
    pending.value = false;
  }
}

async function removeTask(id: string) {
  if (!window.confirm('Supprimer cette tache ?')) {
    return;
  }

  await tasksStore.deleteTask(id);
}
</script>

<template>
  <aside class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div v-if="selectedTask" class="space-y-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Detail</p>
        <h2 class="mt-2 text-xl font-semibold text-zinc-900">{{ selectedTask.shortDescription }}</h2>
      </div>

      <form class="space-y-3" @submit.prevent="saveTask">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Description courte</span>
          <input
            v-model="editForm.shortDescription"
            type="text"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          >
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Description longue</span>
          <textarea
            v-model="editForm.longDescription"
            class="min-h-28 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Echeance</span>
          <input
            v-model="editForm.dueDate"
            type="date"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          >
        </label>

        <div class="space-y-2 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          <p><span class="font-medium text-zinc-900">Creee le :</span> {{ selectedTask.createdAt.slice(0, 10) }}</p>
          <p><span class="font-medium text-zinc-900">Statut :</span> {{ selectedTask.completed ? 'Terminee' : 'Active' }}</p>
        </div>

        <p v-if="errorMessage" class="text-sm text-rose-600">
          {{ errorMessage }}
        </p>

        <button
          class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          :disabled="pending"
        >
          {{ pending ? 'Enregistrement...' : 'Enregistrer les modifications' }}
        </button>
      </form>

      <button
        class="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
        @click="removeTask(selectedTask.id)"
      >
        Supprimer la tache
      </button>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
      Clique sur une tache pour afficher son detail.
    </div>
  </aside>
</template>
