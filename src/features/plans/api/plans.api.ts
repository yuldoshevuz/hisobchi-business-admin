import { client } from '@/lib/api/client';

export type FeatureType = 'BOOLEAN' | 'LIMIT';

export interface PlanPrice {
  id: number;
  planId: number;
  durationDays: number;
  price: string;
  currency: string;
  isActive: boolean;
}

export interface PlanFeatureRow {
  featureCode: string;
  featureType: FeatureType;
  isEnabled: boolean;
  limit: number | null;
}

export interface Plan {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  prices: PlanPrice[];
  features: PlanFeatureRow[];
}

export interface CreatePlanRequest {
  code: string;
  name: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdatePlanRequest {
  name?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpsertPlanFeatureRequest {
  featureCode: string;
  isEnabled?: boolean;
  limit?: number | null;
}

export interface CreatePlanPriceRequest {
  durationDays: number;
  price: number;
  currency?: string;
  isActive?: boolean;
}

export interface UpdatePlanPriceRequest {
  durationDays?: number;
  price?: number;
  currency?: string;
  isActive?: boolean;
}

export const plansApi = {
  list(): Promise<Plan[]> {
    return client.get<Plan[]>('/plans').then((r) => r.data);
  },
  getById(id: number): Promise<Plan> {
    return client.get<Plan>(`/plans/${id}`).then((r) => r.data);
  },
  create(body: CreatePlanRequest): Promise<Plan> {
    return client.post<Plan>('/plans', body).then((r) => r.data);
  },
  update(id: number, body: UpdatePlanRequest): Promise<Plan> {
    return client.patch<Plan>(`/plans/${id}`, body).then((r) => r.data);
  },
  remove(id: number): Promise<void> {
    return client.delete(`/plans/${id}`).then(() => undefined);
  },
  upsertFeature(planId: number, body: UpsertPlanFeatureRequest): Promise<Plan> {
    return client
      .post<Plan>(`/plans/${planId}/features`, body)
      .then((r) => r.data);
  },
  removeFeature(planId: number, featureCode: string): Promise<void> {
    return client
      .delete(`/plans/${planId}/features/${featureCode}`)
      .then(() => undefined);
  },
  createPrice(planId: number, body: CreatePlanPriceRequest): Promise<PlanPrice> {
    return client
      .post<PlanPrice>(`/plans/${planId}/prices`, body)
      .then((r) => r.data);
  },
  updatePrice(
    planId: number,
    priceId: number,
    body: UpdatePlanPriceRequest,
  ): Promise<PlanPrice> {
    return client
      .patch<PlanPrice>(`/plans/${planId}/prices/${priceId}`, body)
      .then((r) => r.data);
  },
  removePrice(planId: number, priceId: number): Promise<void> {
    return client
      .delete(`/plans/${planId}/prices/${priceId}`)
      .then(() => undefined);
  },
};
