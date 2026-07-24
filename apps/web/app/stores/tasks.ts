import type { TaskItem } from '@todo-app/shared-types';

type CreateTaskPayload = {
  listId: string;
  shortDescription: string;
  longDescription?: string;
  dueDate: string;
};

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [] as TaskItem[],
    selectedTaskId: null as string | null,
    isLoading: false,
  }),
  getters: {
    activeTasks: (state) => state.items.filter((task) => !task.completed),
    completedTasks: (state) => state.items.filter((task) => task.completed),
  },
  actions: {
    setTasks(items: TaskItem[]) {
      this.items = items;
    },
    selectTask(taskId: string | null) {
      this.selectedTaskId = taskId;
    },
    async fetchTasks(listId: string | null) {
      if (!listId) {
        this.items = [];
        this.selectedTaskId = null;
        return;
      }

      this.isLoading = true;

      try {
        const items = await useApiFetch<TaskItem[]>('/tasks', {
          query: {
            listId,
          },
        });

        this.items = items;

        const selectedStillExists = items.some((task) => task.id === this.selectedTaskId);

        if (!selectedStillExists) {
          this.selectedTaskId = null;
        }
      } finally {
        this.isLoading = false;
      }
    },
    async createTask(payload: CreateTaskPayload) {
      const item = await useApiFetch<TaskItem>('/tasks', {
        method: 'POST',
        body: payload,
      });

      this.items.push(item);
      this.selectedTaskId = item.id;
      return item;
    },
    async toggleTaskStatus(id: string, completed: boolean) {
      const updatedTask = await useApiFetch<TaskItem>(`/tasks/${id}/complete`, {
        method: 'PATCH',
        body: {
          completed,
        },
      });

      this.items = this.items.map((task) => (task.id === id ? updatedTask : task));
    },
    async deleteTask(id: string) {
      await useApiFetch(`/tasks/${id}`, {
        method: 'DELETE',
      });

      this.items = this.items.filter((task) => task.id !== id);

      if (this.selectedTaskId === id) {
        this.selectedTaskId = null;
      }
    },
  },
});
