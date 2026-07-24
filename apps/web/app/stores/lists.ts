import type { TaskList } from '@todo-app/shared-types';

export const useListsStore = defineStore('lists', {
  state: () => ({
    items: [] as TaskList[],
    selectedListId: null as string | null,
  }),
  actions: {
    setLists(items: TaskList[]) {
      this.items = items;
    },
    selectList(listId: string | null) {
      this.selectedListId = listId;
    },
  },
});
