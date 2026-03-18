import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>, successMessage?: string) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: err });
      toast.error(err.message || 'An unexpected error occurred');
      throw err;
    }
  }, []);

  return { ...state, execute };
}
