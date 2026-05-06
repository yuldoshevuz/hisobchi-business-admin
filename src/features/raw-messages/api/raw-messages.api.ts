import { client } from '@/lib/api/client';

export type RawMessageStatus = 'pending' | 'processed' | 'failed' | 'ignored';

export interface RawMessageRow {
  id: number;
  organizationId: number;
  organizationName: string | null;
  memberId: number;
  memberFullName: string | null;
  source: string;
  messageType: string;
  status: RawMessageStatus;
  content: string | null;
  contentTranscribed: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  telegramMessageId: string | null;
  aiConfidence: string | null;
  aiRawResponse: unknown;
  proposalData: unknown;
  errorData: unknown;
  transactionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedRawMessages {
  data: RawMessageRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListRawMessagesQuery {
  page?: number;
  limit?: number;
  organizationId?: number;
  status?: RawMessageStatus;
}

export const rawMessagesApi = {
  list(query: ListRawMessagesQuery = {}): Promise<PaginatedRawMessages> {
    return client
      .get<PaginatedRawMessages>('/raw-messages', { params: query })
      .then((r) => r.data);
  },
  getById(id: number): Promise<RawMessageRow> {
    return client.get<RawMessageRow>(`/raw-messages/${id}`).then((r) => r.data);
  },
};
