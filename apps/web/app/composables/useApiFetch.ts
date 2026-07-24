type ApiFetchOptions<T> = Parameters<typeof $fetch<T>>[1] & {
  skipAuthRefresh?: boolean;
};

export async function useApiFetch<T>(path: string, options?: ApiFetchOptions<T>) {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const { skipAuthRefresh, headers, ...fetchOptions } = options ?? {};

  try {
    return await $fetch<T>(`${config.public.apiUrl}${path}`, {
      credentials: 'include',
      ...fetchOptions,
      headers: {
        ...headers,
        ...(authStore.accessToken
          ? {
              Authorization: `Bearer ${authStore.accessToken}`,
            }
          : {}),
      },
    });
  } catch (error) {
    if (skipAuthRefresh) {
      throw error;
    }

    const isUnauthorized =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 401;

    if (!isUnauthorized) {
      throw error;
    }

    const sessionRestored = await authStore.refreshSession();

    if (!sessionRestored) {
      throw error;
    }

    return $fetch<T>(`${config.public.apiUrl}${path}`, {
      credentials: 'include',
      ...fetchOptions,
      headers: {
        ...headers,
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
  }
}
