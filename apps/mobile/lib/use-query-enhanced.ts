import { Alert } from 'react-native';
import { useQuery as useTanstackQuery, useMutation as useTanstackMutation, type UseQueryOptions, type UseMutationOptions, type QueryClient } from '@tanstack/react-query';
import { ERROR_MESSAGES } from './error-messages';

// Enhanced useQuery with automatic error handling
export function useQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    showErrorAlert?: boolean;
    errorMessage?: keyof typeof ERROR_MESSAGES | string;
  }
) {
  const {
    showErrorAlert = true,
    errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR,
    ...queryOptions
  } = options;

  return useTanstackQuery<TData, TError>({
    ...queryOptions,
    onError: (error) => {
      if (showErrorAlert) {
        Alert.alert('Error', typeof errorMessage === 'string' ? errorMessage : errorMessage);
      }
      queryOptions.onError?.(error);
    },
  });
}

// Enhanced useMutation with automatic error handling and loading states
export function useMutation<TData, TError = Error, TVariables = unknown>(
  options: UseMutationOptions<TData, TError, TVariables> & {
    showSuccessAlert?: boolean;
    successMessage?: string;
    showErrorAlert?: boolean;
    errorMessage: (error: TError) => keyof typeof ERROR_MESSAGES | string;
    invalidateQueries?: (queryClient: QueryClient) => void;
  }
) {
  return useTanstackMutation<TData, TError, TVariables>({
    ...options,
    onError: (error) => {
      if (options.showErrorAlert !== false) {
        const errorMsg = typeof options.errorMessage === 'function'
          ? options.errorMessage(error)
          : options.errorMessage;

        Alert.alert('Error', typeof errorMsg === 'string' ? errorMsg : errorMsg);
      }
      options.onError?.(error);
    },
    onSuccess: (data) => {
      if (options.showSuccessAlert && options.successMessage) {
        Alert.alert('Success', options.successMessage);
      }
      options.onSuccess?.(data);
    },
  });
}

// Utility to parse API error messages
export function parseApiError(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    const firstError = Object.values(errors)[0] as string[];
    return Array.isArray(firstError) ? firstError[0] : String(firstError);
  }
  if (error?.message) {
    return error.message;
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Show error alert with parsed API error
export function showErrorAlert(error: any, title: string = 'Error') {
  const message = parseApiError(error);
  Alert.alert(title, message);
}

// Show success alert
export function showSuccessAlert(title: string, message: string) {
  Alert.alert(title, message);
}

// Show confirmation dialog
export function showConfirmDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) {
  Alert.alert(
    title,
    message,
    [
      { text: 'Batal', style: 'cancel', onPress: onCancel },
      { text: 'Ya', onPress: onConfirm },
    ],
    { cancelable: false }
  );
}
