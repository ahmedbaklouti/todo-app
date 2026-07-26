<script setup lang="ts">
import ConfirmDialog from '../ConfirmDialog.vue';

const tasksStore = useTasksStore();
const pending = ref(false);
const errorMessage = ref('');
const isDeleteDialogOpen = ref(false);

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

function closePanel() {
  tasksStore.selectTask(null);
}

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
    errorMessage.value = useApiErrorMessage(
      error,
      'Impossible de mettre a jour la tache.',
    );
  } finally {
    pending.value = false;
  }
}

function askTaskDeletion() {
  isDeleteDialogOpen.value = true;
}

function syncDeleteDialogState(value: boolean) {
  isDeleteDialogOpen.value = value;
}

async function confirmTaskDeletion() {
  if (!selectedTask.value) {
    return;
  }

  await tasksStore.deleteTask(selectedTask.value.id);
  isDeleteDialogOpen.value = false;
}
</script>

<template>
  <aside v-if="selectedTask" class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Detail</p>
          <h2 class="mt-2 text-xl font-semibold text-zinc-900">{{ selectedTask.shortDescription }}</h2>
        </div>
        <button
          class="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
          @click="closePanel"
        >
          Fermer
        </button>
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
        @click="askTaskDeletion"
      >
        Supprimer la tache
      </button>
    </div>

    <ConfirmDialog
      :model-value="isDeleteDialogOpen"
      title="Supprimer cette tache ?"
      message="Cette action est definitive et retirera la tache de la liste."
      confirm-label="Supprimer la tache"
      tone="danger"
      @update:model-value="syncDeleteDialogState"
      @confirm="confirmTaskDeletion"
    />
  </aside>
</template>
