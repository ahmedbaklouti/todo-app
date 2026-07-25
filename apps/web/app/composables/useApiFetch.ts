type ApiFetchOptions<T> = Parameters<typeof $fetch<T>>[1] & {
  skipAuthRefresh?: boolean;
};

function getUnauthorizedStatus(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }

  if (
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status;
  }

  return null;
}

export async function useApiFetch<T>(path: string, options?: ApiFetchOptions<T>) {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const { skipAuthRefresh, headers, ...fetchOptions } = options ?? {};
  const apiBaseUrl = import.meta.server ? config.apiInternalUrl : config.public.apiUrl;

  const buildHeaders = () => {
    const requestHeaders = new Headers(headers as HeadersInit | undefined);

    if (import.meta.server) {
      const incomingHeaders = useRequestHeaders(['cookie']);

      for (const [key, value] of Object.entries(incomingHeaders)) {
        if (value) {
          requestHeaders.set(key, value);
        }
      }
    }

    if (authStore.accessToken) {
      requestHeaders.set('Authorization', `Bearer ${authStore.accessToken}`);
    }

    return requestHeaders;
  };

  try {
    return await $fetch<T>(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      ...fetchOptions,
      headers: buildHeaders(),
    });
  } catch (error) {
    if (skipAuthRefresh) {
      throw error;
    }

    if (getUnauthorizedStatus(error) !== 401) {
      throw error;
    }

    const sessionRestored = await authStore.refreshSession();

    if (!sessionRestored) {
      if (import.meta.client) {
        await navigateTo('/login', { replace: true });
      }

      throw error;
    }

    return $fetch<T>(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      ...fetchOptions,
      headers: buildHeaders(),
    });
  }
}
