<script setup lang="ts">
import ConfirmDialog from '../ConfirmDialog.vue';

const tasksStore = useTasksStore();
const pending = ref(false);
const errorMessage = ref('');
const isDeleteDialogOpen = ref(false);

const selectedTask = computed(() =>
  tasksStore.items.find((task) => task.id === tasksStore.selectedTaskId) ?? null,
);

const statusLabel = computed(() =>
  selectedTask.value?.completed ? 'Terminee' : 'En cours',
);

const statusClass = computed(() =>
  selectedTask.value?.completed
    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border border-amber-200 bg-amber-50 text-amber-700',
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

  if (!editForm.shortDescription.trim()) {
    errorMessage.value = 'La description courte est obligatoire.';
    return;
  }

  if (!editForm.dueDate) {
    errorMessage.value = "La date d'echeance est obligatoire.";
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

watchEffect(() => {
  if (editForm.shortDescription.trim() && editForm.dueDate) {
    errorMessage.value = '';
  }
});
</script>

<template>
  <aside
    v-if="selectedTask"
    class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
  >
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Tache</p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="statusClass"
            >
              {{ statusLabel }}
            </span>
            <span class="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              Echeance {{ selectedTask.dueDate.slice(0, 10) }}
            </span>
          </div>
          <h2 class="mt-3 truncate text-xl font-semibold text-zinc-900">
            {{ selectedTask.shortDescription }}
          </h2>
        </div>
        <button
          type="button"
          class="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
          aria-label="Fermer le panneau de details"
          @click="closePanel"
        >
          Fermer
        </button>
      </div>

      <div class="grid gap-3 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
        <div class="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
          <span class="font-medium text-zinc-900">Cree le</span>
          <span>{{ selectedTask.createdAt.slice(0, 10) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
          <span class="font-medium text-zinc-900">Date limite</span>
          <span>{{ selectedTask.dueDate.slice(0, 10) }}</span>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="saveTask">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Description courte</span>
          <input
            v-model="editForm.shortDescription"
            type="text"
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="Ex: Contacter le candidat"
          >
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-zinc-700">Description longue</span>
          <textarea
            v-model="editForm.longDescription"
            class="min-h-28 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="Ajoute ici les details utiles pour suivre la tache."
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

        <p v-if="errorMessage" class="text-sm text-rose-600">
          {{ errorMessage }}
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            class="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            :disabled="pending"
          >
            {{ pending ? 'Enregistrement...' : 'Enregistrer' }}
          </button>

          <button
            type="button"
            class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
            @click="askTaskDeletion"
          >
            Supprimer la tache
          </button>
        </div>
      </form>
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
