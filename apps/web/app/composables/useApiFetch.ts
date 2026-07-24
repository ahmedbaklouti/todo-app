export function useApiFetch<T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) {
  const config = useRuntimeConfig();

  return $fetch<T>(`${config.public.apiUrl}${path}`, {
    credentials: 'include',
    ...options,
  });
}
