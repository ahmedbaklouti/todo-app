<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'primary';
  }>(),
  {
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    tone: 'primary',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();

const confirmButtonClass = computed(() =>
  props.tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-blue-600 hover:bg-blue-700',
);

function closeDialog() {
  emit('update:modelValue', false);
}

function confirmDialog() {
  emit('confirm');
  closeDialog();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4"
      @click.self="closeDialog"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Confirmation</p>
        <h2 class="mt-3 text-xl font-semibold text-zinc-900">{{ title }}</h2>
        <p class="mt-2 text-sm leading-6 text-zinc-600">{{ message }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            class="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
            @click="closeDialog"
          >
            {{ cancelLabel }}
          </button>
          <button
            class="rounded-xl px-4 py-2 text-sm font-medium text-white transition"
            :class="confirmButtonClass"
            @click="confirmDialog"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
