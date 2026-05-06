import { client } from '@/lib/api/client';
import type { FeatureType } from '@/features/plans/api/plans.api';

export interface Feature {
  id: number;
  code: string;
  type: FeatureType;
  description: string | null;
}

export interface CreateFeatureRequest {
  code: string;
  type: FeatureType;
  description?: string;
}

export interface UpdateFeatureRequest {
  description?: string;
}

export const featuresApi = {
  list(): Promise<Feature[]> {
    return client.get<Feature[]>('/features').then((r) => r.data);
  },
  create(body: CreateFeatureRequest): Promise<Feature> {
    return client.post<Feature>('/features', body).then((r) => r.data);
  },
  update(id: number, body: UpdateFeatureRequest): Promise<Feature> {
    return client.patch<Feature>(`/features/${id}`, body).then((r) => r.data);
  },
  remove(id: number): Promise<void> {
    return client.delete(`/features/${id}`).then(() => undefined);
  },
};
