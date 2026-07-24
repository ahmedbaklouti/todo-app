<script setup lang="ts">
const listsStore = useListsStore();

const pending = ref(false);
const newListName = ref('');
const errorMessage = ref('');

async function createList() {
  if (!newListName.value.trim()) {
    return;
  }

  pending.value = true;
  errorMessage.value = '';

  try {
    await listsStore.createList(newListName.value.trim());
    newListName.value = '';
  } catch (error) {
    errorMessage.value =
      typeof error === 'object' &&
      error !== null &&
      'data' in error &&
      typeof error.data === 'object' &&
      error.data !== null &&
      'message' in error.data
        ? String(error.data.message)
        : 'Impossible de creer la liste.';
  } finally {
    pending.value = false;
  }
}

async function removeList(id: string) {
  if (!window.confirm('Supprimer cette liste et toutes ses taches ?')) {
    return;
  }

  await listsStore.deleteList(id);
}
</script>

<template>
  <aside class="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div class="mb-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Listes</p>
        <h2 class="text-lg font-semibold text-zinc-900">Mes listes</h2>
      </div>
    </div>

    <form class="mb-4 space-y-3" @submit.prevent="createList">
      <input
        v-model="newListName"
        type="text"
        class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
        placeholder="Nom unique de la liste"
      >
      <button
        class="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        :disabled="pending"
      >
        {{ pending ? 'Creation...' : 'Nouvelle liste' }}
      </button>
      <p v-if="errorMessage" class="text-sm text-rose-600">
        {{ errorMessage }}
      </p>
    </form>

    <div v-if="listsStore.items.length === 0" class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
      Cree ta premiere liste pour commencer.
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
        <span class="flex items-center gap-2 text-xs opacity-70">
          <span>ouvrir</span>
          <span
            class="rounded-full px-2 py-1"
            :class="item.id === listsStore.selectedListId ? 'bg-white/10 text-white' : 'bg-white text-zinc-500'"
            @click.stop="removeList(item.id)"
          >
            supprimer
          </span>
        </span>
      </button>
    </div>
  </aside>
</template>
