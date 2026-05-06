import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  featuresApi,
  type CreateFeatureRequest,
  type Feature,
  type UpdateFeatureRequest,
} from '../api/features.api';
import { plansKeys } from '@/features/plans/hooks/use-plans';

export const featuresKeys = {
  all: () => ['admin', 'features'] as const,
  list: () => ['admin', 'features', 'list'] as const,
} as const;

export function useFeatures(): UseQueryResult<Feature[], Error> {
  return useQuery<Feature[], Error>({
    queryKey: featuresKeys.list(),
    queryFn: () => featuresApi.list(),
  });
}

export function useCreateFeature(): UseMutationResult<
  Feature,
  Error,
  CreateFeatureRequest
> {
  const qc = useQueryClient();
  return useMutation<Feature, Error, CreateFeatureRequest>({
    mutationFn: (body) => featuresApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: featuresKeys.all() });
    },
  });
}

interface UpdateVars {
  id: number;
  body: UpdateFeatureRequest;
}

export function useUpdateFeature(): UseMutationResult<Feature, Error, UpdateVars> {
  const qc = useQueryClient();
  return useMutation<Feature, Error, UpdateVars>({
    mutationFn: ({ id, body }) => featuresApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: featuresKeys.all() });
    },
  });
}

export function useDeleteFeature(): UseMutationResult<void, Error, number> {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => featuresApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: featuresKeys.all() });
      // Plan rows include feature catalog data; refresh them too.
      void qc.invalidateQueries({ queryKey: plansKeys.all() });
    },
  });
}
