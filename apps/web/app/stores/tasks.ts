import type { TaskItem } from '@todo-app/shared-types';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [] as TaskItem[],
    selectedTaskId: null as string | null,
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
  },
});
