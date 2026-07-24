<script setup lang="ts">
const tasksStore = useTasksStore();
</script>

<template>
  <section class="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-end justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Taches</p>
        <h2 class="text-2xl font-semibold text-zinc-900">Liste active</h2>
      </div>
      <button class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
        Ajouter une tache
      </button>
    </div>

    <div v-if="tasksStore.activeTasks.length === 0" class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
      Selectionne une liste puis ajoute ta premiere tache.
    </div>

    <div v-else class="space-y-3">
      <button
        v-for="task in tasksStore.activeTasks"
        :key="task.id"
        class="flex w-full items-start justify-between rounded-2xl border border-zinc-200 px-4 py-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
        @click="tasksStore.selectTask(task.id)"
      >
        <div>
          <p class="text-sm font-medium text-zinc-900">{{ task.shortDescription }}</p>
          <p class="mt-1 text-xs text-zinc-500">Echeance {{ task.dueDate }}</p>
        </div>
        <span class="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-500">active</span>
      </button>
    </div>

    <details class="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <summary class="cursor-pointer text-sm font-medium text-zinc-700">
        Mes taches terminees ({{ tasksStore.completedTasks.length }})
      </summary>

      <div class="mt-4 space-y-2">
        <div
          v-for="task in tasksStore.completedTasks"
          :key="task.id"
          class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {{ task.shortDescription }}
        </div>
      </div>
    </details>
  </section>
</template>
