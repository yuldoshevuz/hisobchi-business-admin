import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { orgsKeys } from '@/features/organizations/hooks/use-organizations';
import {
  subscriptionsApi,
  type AssignSubscriptionRequest,
  type Subscription,
} from '../api/subscriptions.api';

export function useAssignSubscription(): UseMutationResult<
  Subscription,
  Error,
  AssignSubscriptionRequest
> {
  const qc = useQueryClient();
  return useMutation<Subscription, Error, AssignSubscriptionRequest>({
    mutationFn: (body) => subscriptionsApi.assign(body),
    onSuccess: () => {
      // Org overview rows surface owner subscription state — refresh them so
      // the change is visible immediately after the dialog closes.
      void qc.invalidateQueries({ queryKey: orgsKeys.all() });
    },
  });
}
