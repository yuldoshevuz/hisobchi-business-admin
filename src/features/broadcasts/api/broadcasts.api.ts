import { client } from '@/lib/api/client';

export type BroadcastStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled'
  | 'failed';

export type BroadcastDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'blocked'
  | 'skipped';

export type BroadcastRecurrence =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';
export type BroadcastTargetKind = 'all' | 'users' | 'segment';
export type BroadcastMediaType = 'photo' | 'video' | 'document' | 'album';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface InlineButton {
  text: string;
  url: string;
}

export interface BroadcastSegmentFilter {
  locales?: string[];
  hasTelegram?: boolean;
  hasOrganization?: boolean;
  subscriptionStatuses?: SubscriptionStatus[];
  planCodes?: string[];
  createdFrom?: string;
  createdTo?: string;
}

export interface BroadcastTargeting {
  kind: BroadcastTargetKind;
  userIds?: number[];
  filter?: BroadcastSegmentFilter;
}

export interface BroadcastSummary {
  id: number;
  title: string;
  status: BroadcastStatus;
  recurrence: BroadcastRecurrence;
  targetKind: BroadcastTargetKind;
  scheduledAt: string | null;
  nextRunAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  blockedCount: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastDetail extends BroadcastSummary {
  contentUz: string;
  contentRu: string;
  contentEn: string;
  isMultiLanguage: boolean;
  mediaType: BroadcastMediaType | null;
  mediaUrls: string[];
  inlineButtons: InlineButton[][];
  targeting: BroadcastTargeting;
  cancelledAt: string | null;
  cancelledById: number | null;
}

export interface PaginatedBroadcasts {
  data: BroadcastSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface BroadcastDelivery {
  id: number;
  userId: number;
  userFullName: string;
  userPhoneNumber: string | null;
  telegramId: number | null;
  locale: string;
  status: BroadcastDeliveryStatus;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface AudiencePreview {
  totalCount: number;
  deliverableCount: number;
  excludedNoTelegram: number;
}

export interface UpsertBroadcastBody {
  title: string;
  contentUz: string;
  contentRu?: string;
  contentEn?: string;
  isMultiLanguage?: boolean;
  mediaType?: BroadcastMediaType | null;
  mediaUrls?: string[];
  inlineButtons?: { buttons: InlineButton[] }[];
  targeting: BroadcastTargeting;
  recurrence?: BroadcastRecurrence;
  scheduledAt?: string;
}

export interface ListBroadcastsQuery {
  page?: number;
  limit?: number;
  status?: BroadcastStatus;
}

export interface UploadedMedia {
  url: string;
  mimeType: string;
  size: number;
  category: 'photo' | 'video' | 'document';
}

export const broadcastsApi = {
  uploadFile(file: File): Promise<UploadedMedia> {
    const form = new FormData();
    form.append('file', file);
    // No Content-Type header — axios sets the multipart boundary
    // automatically when given a FormData body.
    return client
      .post<UploadedMedia>('/broadcasts/uploads', form)
      .then((r) => r.data);
  },
  list(query: ListBroadcastsQuery = {}): Promise<PaginatedBroadcasts> {
    return client
      .get<PaginatedBroadcasts>('/broadcasts', { params: query })
      .then((r) => r.data);
  },
  getById(id: number): Promise<BroadcastDetail> {
    return client.get<BroadcastDetail>(`/broadcasts/${id}`).then((r) => r.data);
  },
  create(body: UpsertBroadcastBody): Promise<BroadcastDetail> {
    return client.post<BroadcastDetail>('/broadcasts', body).then((r) => r.data);
  },
  update(id: number, body: UpsertBroadcastBody): Promise<BroadcastDetail> {
    return client
      .patch<BroadcastDetail>(`/broadcasts/${id}`, body)
      .then((r) => r.data);
  },
  send(id: number): Promise<BroadcastDetail> {
    return client
      .post<BroadcastDetail>(`/broadcasts/${id}/send`)
      .then((r) => r.data);
  },
  cancel(id: number): Promise<BroadcastDetail> {
    return client
      .post<BroadcastDetail>(`/broadcasts/${id}/cancel`)
      .then((r) => r.data);
  },
  previewAudience(targeting: BroadcastTargeting): Promise<AudiencePreview> {
    return client
      .post<AudiencePreview>('/broadcasts/preview-audience', { targeting })
      .then((r) => r.data);
  },
  deliveries(
    id: number,
    page = 1,
    limit = 50,
  ): Promise<BroadcastDelivery[]> {
    return client
      .get<BroadcastDelivery[]>(`/broadcasts/${id}/deliveries`, {
        params: { page, limit },
      })
      .then((r) => r.data);
  },
};
