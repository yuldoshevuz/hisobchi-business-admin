import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  plansApi,
  type CreatePlanPriceRequest,
  type CreatePlanRequest,
  type Plan,
  type PlanPrice,
  type UpdatePlanPriceRequest,
  type UpdatePlanRequest,
  type UpsertPlanFeatureRequest,
} from '../api/plans.api';

export const plansKeys = {
  all: () => ['admin', 'plans'] as const,
  list: () => ['admin', 'plans', 'list'] as const,
  detail: (id: number) => ['admin', 'plans', 'detail', id] as const,
} as const;

export function usePlans(): UseQueryResult<Plan[], Error> {
  return useQuery<Plan[], Error>({
    queryKey: plansKeys.list(),
    queryFn: () => plansApi.list(),
  });
}

export function usePlan(id: number | null): UseQueryResult<Plan, Error> {
  return useQuery<Plan, Error>({
    queryKey: plansKeys.detail(id ?? 0),
    queryFn: () => plansApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useCreatePlan(): UseMutationResult<Plan, Error, CreatePlanRequest> {
  const qc = useQueryClient();
  return useMutation<Plan, Error, CreatePlanRequest>({
    mutationFn: (body) => plansApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: plansKeys.all() });
    },
  });
}

interface UpdatePlanVars {
  id: number;
  body: UpdatePlanRequest;
}

export function useUpdatePlan(): UseMutationResult<Plan, Error, UpdatePlanVars> {
  const qc = useQueryClient();
  return useMutation<Plan, Error, UpdatePlanVars>({
    mutationFn: ({ id, body }) => plansApi.update(id, body),
    onSuccess: (plan) => {
      qc.setQueryData(plansKeys.detail(plan.id), plan);
      void qc.invalidateQueries({ queryKey: plansKeys.all() });
    },
  });
}

export function useDeletePlan(): UseMutationResult<void, Error, number> {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => plansApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: plansKeys.all() });
    },
  });
}

interface UpsertFeatureVars {
  planId: number;
  body: UpsertPlanFeatureRequest;
}

export function useUpsertPlanFeature(): UseMutationResult<
  Plan,
  Error,
  UpsertFeatureVars
> {
  const qc = useQueryClient();
  return useMutation<Plan, Error, UpsertFeatureVars>({
    mutationFn: ({ planId, body }) => plansApi.upsertFeature(planId, body),
    onSuccess: (plan) => {
      qc.setQueryData(plansKeys.detail(plan.id), plan);
      void qc.invalidateQueries({ queryKey: plansKeys.all() });
    },
  });
}

interface RemoveFeatureVars {
  planId: number;
  featureCode: string;
}

export function useRemovePlanFeature(): UseMutationResult<
  void,
  Error,
  RemoveFeatureVars
> {
  const qc = useQueryClient();
  return useMutation<void, Error, RemoveFeatureVars>({
    mutationFn: ({ planId, featureCode }) =>
      plansApi.removeFeature(planId, featureCode),
    onSuccess: (_void, { planId }) => {
      void qc.invalidateQueries({ queryKey: plansKeys.detail(planId) });
      void qc.invalidateQueries({ queryKey: plansKeys.list() });
    },
  });
}

interface CreatePriceVars {
  planId: number;
  body: CreatePlanPriceRequest;
}

export function useCreatePlanPrice(): UseMutationResult<
  PlanPrice,
  Error,
  CreatePriceVars
> {
  const qc = useQueryClient();
  return useMutation<PlanPrice, Error, CreatePriceVars>({
    mutationFn: ({ planId, body }) => plansApi.createPrice(planId, body),
    onSuccess: (_price, { planId }) => {
      void qc.invalidateQueries({ queryKey: plansKeys.detail(planId) });
      void qc.invalidateQueries({ queryKey: plansKeys.list() });
    },
  });
}

interface UpdatePriceVars {
  planId: number;
  priceId: number;
  body: UpdatePlanPriceRequest;
}

export function useUpdatePlanPrice(): UseMutationResult<
  PlanPrice,
  Error,
  UpdatePriceVars
> {
  const qc = useQueryClient();
  return useMutation<PlanPrice, Error, UpdatePriceVars>({
    mutationFn: ({ planId, priceId, body }) =>
      plansApi.updatePrice(planId, priceId, body),
    onSuccess: (_price, { planId }) => {
      void qc.invalidateQueries({ queryKey: plansKeys.detail(planId) });
      void qc.invalidateQueries({ queryKey: plansKeys.list() });
    },
  });
}

interface RemovePriceVars {
  planId: number;
  priceId: number;
}

export function useRemovePlanPrice(): UseMutationResult<
  void,
  Error,
  RemovePriceVars
> {
  const qc = useQueryClient();
  return useMutation<void, Error, RemovePriceVars>({
    mutationFn: ({ planId, priceId }) => plansApi.removePrice(planId, priceId),
    onSuccess: (_void, { planId }) => {
      void qc.invalidateQueries({ queryKey: plansKeys.detail(planId) });
      void qc.invalidateQueries({ queryKey: plansKeys.list() });
    },
  });
}
