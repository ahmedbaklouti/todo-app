function normalizeMessage(message: unknown) {
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    const normalizedMessages = message
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (normalizedMessages.length > 0) {
      return normalizedMessages.join(' ');
    }
  }

  return null;
}

export function useApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return fallback;
  }

  const { data } = error;

  if (typeof data !== 'object' || data === null) {
    return fallback;
  }

  if ('message' in data) {
    const normalizedMessage = normalizeMessage(data.message);

    if (normalizedMessage) {
      return normalizedMessage;
    }
  }

  if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  return fallback;
}
