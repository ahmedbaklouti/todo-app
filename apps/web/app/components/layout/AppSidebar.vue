<script setup lang="ts">
const listsStore = useListsStore();
</script>

<template>
  <aside class="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Listes</p>
        <h2 class="text-lg font-semibold text-zinc-900">Mes listes</h2>
      </div>
      <button class="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
        Nouvelle
      </button>
    </div>

    <div class="space-y-2">
      <button
        v-for="item in listsStore.items"
        :key="item.id"
        class="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition"
        :class="item.id === listsStore.selectedListId ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'"
        @click="listsStore.selectList(item.id)"
      >
        <span>{{ item.name }}</span>
        <span class="text-xs opacity-70">ouvrir</span>
      </button>
    </div>
  </aside>
</template>
