export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type TaskList = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskItem = {
  id: string;
  listId: string;
  shortDescription: string;
  longDescription: string | null;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
