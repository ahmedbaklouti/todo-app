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

async function retryListsFetch() {
  await listsStore.fetchLists();
}

async function createList() {
  if (!newListName.value.trim()) {
    errorMessage.value = 'Le nom de la liste est obligatoire.';
    return;
  }

  pending.value = true;
  errorMessage.value = '';

  try {
    await listsStore.createList(newListName.value.trim());
    newListName.value = '';
    emit('select');
  } catch (error) {
    errorMessage.value = useApiErrorMessage(
      error,
      'Impossible de creer la liste.',
    );
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
  const nextSelectedListId = listsStore.selectedListId === id ? null : id;
  listsStore.selectList(nextSelectedListId);
  emit('select');
}

watch(newListName, (value) => {
  if (value.trim()) {
    errorMessage.value = '';
  }
});
</script>

<template>
  <aside
    class="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all"
    :class="props.collapsed ? 'items-center px-3 py-4' : 'p-5'"
    :aria-busy="listsStore.isLoading"
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
        type="button"
        class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
        :aria-label="props.collapsed ? 'Deployer la sidebar' : 'Retracter la sidebar'"
        :aria-expanded="!props.collapsed"
        @click="emit('toggle')"
      >
        {{ props.collapsed ? '>' : '<' }}
      </button>
    </div>

    <template v-if="!props.collapsed">
      <form class="mb-4 space-y-3" @submit.prevent="createList">
        <div class="space-y-1">
          <h3 class="text-sm font-semibold text-zinc-900">Organiser mes listes</h3>
          <p class="text-sm text-zinc-500">
            Cree une liste pour structurer tes taches par sujet, client ou priorite.
          </p>
        </div>
        <input
          v-model="newListName"
          type="text"
          class="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          placeholder="Nom unique de la liste"
          :disabled="pending || listsStore.isLoading"
        >
        <button
          class="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          :disabled="pending || listsStore.isLoading"
        >
          {{ pending ? 'Creation en cours...' : 'Creer la liste' }}
        </button>
        <p v-if="errorMessage" class="text-sm text-rose-600">
          {{ errorMessage }}
        </p>
      </form>

      <div
        v-if="listsStore.errorMessage"
        class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
      >
        <p class="text-sm font-medium text-rose-700">{{ listsStore.errorMessage }}</p>
        <button
          type="button"
          class="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
          @click="retryListsFetch"
        >
          Reessayer
        </button>
      </div>

      <div v-if="listsStore.isLoading" class="space-y-2">
        <div
          v-for="index in 3"
          :key="index"
          class="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div class="h-4 w-2/3 rounded bg-zinc-200" />
          <div class="mt-3 h-3 w-24 rounded bg-zinc-200" />
        </div>
      </div>

      <div
        v-else-if="listsStore.items.length === 0"
        class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500"
      >
        <p class="font-medium text-zinc-700">Aucune liste pour le moment.</p>
        <p class="mt-2">
          Cree ta premiere liste pour commencer a organiser ton espace de travail.
        </p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="item in listsStore.items"
          :key="item.id"
          class="flex items-center gap-2 rounded-2xl border p-2 transition"
          :class="
            item.id === listsStore.selectedListId
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
              : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100'
          "
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition"
            @click="selectList(item.id)"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ item.name }}</span>
              <span
                class="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                :class="
                  item.id === listsStore.selectedListId
                    ? 'bg-white/10 text-white'
                    : 'bg-white text-zinc-500'
                "
              >
                {{ item.id === listsStore.selectedListId ? 'Deselectionner la liste' : 'Ouvrir la liste' }}
              </span>
            </span>
          </button>

          <button
            type="button"
            class="shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition"
            :class="
              item.id === listsStore.selectedListId
                ? 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
            "
            aria-label="Supprimer la liste"
            @click.stop="askListDeletion(item.id)"
          >
            Supprimer
          </button>
        </div>
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
          type="button"
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
