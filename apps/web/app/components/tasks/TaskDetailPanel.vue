<script setup lang="ts">
const tasksStore = useTasksStore();

const selectedTask = computed(() =>
  tasksStore.items.find((task) => task.id === tasksStore.selectedTaskId) ?? null,
);
</script>

<template>
  <aside class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div v-if="selectedTask" class="space-y-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Detail</p>
        <h2 class="mt-2 text-xl font-semibold text-zinc-900">{{ selectedTask.shortDescription }}</h2>
      </div>

      <div class="space-y-3 text-sm text-zinc-600">
        <p><span class="font-medium text-zinc-900">Description :</span> {{ selectedTask.longDescription || 'Aucune description longue' }}</p>
        <p><span class="font-medium text-zinc-900">Echeance :</span> {{ selectedTask.dueDate }}</p>
        <p><span class="font-medium text-zinc-900">Creee le :</span> {{ selectedTask.createdAt }}</p>
      </div>

      <button class="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700">
        Supprimer la tache
      </button>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
      Clique sur une tache pour afficher son detail.
    </div>
  </aside>
</template>
