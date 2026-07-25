<script setup lang="ts">
import ConfirmDialog from '../ConfirmDialog.vue';

const props = defineProps<{
  collapsed: boolean;
  showToggle?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
  select: [];
}>();

const listsStore = useListsStore();

const pending = ref(false);
const newListName = ref('');
const errorMessage = ref('');
const listIdPendingDeletion = ref<string | null>(null);

async function createList() {
  if (!newListName.value.trim()) {
    return;
  }

  pending.value = true;
  errorMessage.value = '';

  try {
    await listsStore.createList(newListName.value.trim());
    newListName.value = '';
    emit('select');
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

function askListDeletion(id: string) {
  listIdPendingDeletion.value = id;
}

function closeDeleteDialog() {
  listIdPendingDeletion.value = null;
}

async function confirmListDeletion() {
  if (!listIdPendingDeletion.value) {
    return;
  }

  await listsStore.deleteList(listIdPendingDeletion.value);
  closeDeleteDialog();
}

function selectList(id: string) {
  listsStore.selectList(id);
  emit('select');
}
</script>

<template>
  <aside
    class="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all"
    :class="props.collapsed ? 'items-center px-3 py-4' : 'p-5'"
  >
    <div
      class="mb-4 flex w-full items-start justify-between"
      :class="props.collapsed ? 'flex-col items-center gap-3' : ''"
    >
      <div v-if="!props.collapsed">
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Listes</p>
        <h2 class="text-lg font-semibold text-zinc-900">Mes listes</h2>
      </div>
      <button
        v-if="props.showToggle !== false"
        class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
        :aria-label="props.collapsed ? 'Deployer la sidebar' : 'Retracter la sidebar'"
        @click="emit('toggle')"
      >
        {{ props.collapsed ? '>' : '<' }}
      </button>
    </div>

    <template v-if="!props.collapsed">
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

      <div
        v-if="listsStore.items.length === 0"
        class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
      >
        Cree ta premiere liste pour commencer.
      </div>

      <div class="space-y-2">
        <button
          v-for="item in listsStore.items"
          :key="item.id"
          class="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition"
          :class="item.id === listsStore.selectedListId ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'"
          @click="selectList(item.id)"
        >
          <span>{{ item.name }}</span>
          <span class="flex items-center gap-2 text-xs opacity-70">
            <span>ouvrir</span>
            <span
              class="rounded-full px-2 py-1"
              :class="item.id === listsStore.selectedListId ? 'bg-white/10 text-white' : 'bg-white text-zinc-500'"
              @click.stop="askListDeletion(item.id)"
            >
              supprimer
            </span>
          </span>
        </button>
      </div>
    </template>

    <template v-else>
      <div
        v-if="listsStore.items.length === 0"
        class="mt-4 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400"
      >
        0
      </div>

      <div v-else class="mt-4 flex w-full flex-col items-center gap-3">
        <button
          v-for="item in listsStore.items"
          :key="item.id"
          class="flex size-12 items-center justify-center rounded-2xl text-sm font-semibold transition"
          :class="item.id === listsStore.selectedListId ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'"
          :title="item.name"
          @click="selectList(item.id)"
        >
          {{ item.name.charAt(0).toUpperCase() }}
        </button>
      </div>
    </template>

    <ConfirmDialog
      :model-value="Boolean(listIdPendingDeletion)"
      title="Supprimer cette liste ?"
      message="Toutes les taches associees seront egalement supprimees."
      confirm-label="Supprimer la liste"
      tone="danger"
      @update:model-value="(value) => { if (!value) closeDeleteDialog(); }"
      @confirm="confirmListDeletion"
    />
  </aside>
</template>
