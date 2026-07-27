import type { TaskList } from '@todo-app/shared-types';

export const useListsStore = defineStore('lists', {
  state: () => ({
    items: [] as TaskList[],
    selectedListId: null as string | null,
    isLoading: false,
    errorMessage: '',
  }),
  actions: {
    setLists(items: TaskList[]) {
      this.items = items;
    },
    selectList(listId: string | null) {
      this.selectedListId = listId;
    },
    async fetchLists() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const items = await useApiFetch<TaskList[]>('/lists');
        this.setLists(items);

        if (items.length === 0) {
          this.selectedListId = null;
          return;
        }

        const selectedStillExists = items.some((item) => item.id === this.selectedListId);

        if (!selectedStillExists) {
          this.selectedListId = items[0]?.id ?? null;
        }
      } catch (error) {
        this.errorMessage = useApiErrorMessage(
          error,
          'Impossible de charger les listes.',
        );
      } finally {
        this.isLoading = false;
      }
    },
    async createList(name: string) {
      const item = await useApiFetch<TaskList>('/lists', {
        method: 'POST',
        body: {
          name,
        },
      });

      this.items.push(item);
      this.selectedListId = item.id;
      this.errorMessage = '';
      return item;
    },
    async deleteList(id: string) {
      await useApiFetch(`/lists/${id}`, {
        method: 'DELETE',
      });

      this.items = this.items.filter((item) => item.id !== id);

      if (this.selectedListId === id) {
        this.selectedListId = this.items[0]?.id ?? null;
      }

      this.errorMessage = '';
    },
  },
});
