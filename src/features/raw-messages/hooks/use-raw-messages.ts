import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  rawMessagesApi,
  type ListRawMessagesQuery,
  type PaginatedRawMessages,
  type RawMessageRow,
} from '../api/raw-messages.api';

export const rawMessagesKeys = {
  all: () => ['admin', 'raw-messages'] as const,
  list: (filters: ListRawMessagesQuery) =>
    ['admin', 'raw-messages', 'list', filters] as const,
  detail: (id: number) => ['admin', 'raw-messages', 'detail', id] as const,
} as const;

export function useAdminRawMessages(
  filters: ListRawMessagesQuery,
): UseQueryResult<PaginatedRawMessages, Error> {
  return useQuery<PaginatedRawMessages, Error>({
    queryKey: rawMessagesKeys.list(filters),
    queryFn: () => rawMessagesApi.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useAdminRawMessage(
  id: number | null,
): UseQueryResult<RawMessageRow, Error> {
  return useQuery<RawMessageRow, Error>({
    queryKey: rawMessagesKeys.detail(id ?? 0),
    queryFn: () => rawMessagesApi.getById(id as number),
    enabled: id !== null,
  });
}
