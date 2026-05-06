import { client } from '@/lib/api/client';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  planPriceId: number | null;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
}

export interface AssignSubscriptionRequest {
  userId: number;
  planId: number;
  /** Omit for default/free assignment with no end date. */
  planPriceId?: number;
}

export const subscriptionsApi = {
  assign(body: AssignSubscriptionRequest): Promise<Subscription> {
    return client
      .post<Subscription>('/subscriptions', body)
      .then((r) => r.data);
  },
};
