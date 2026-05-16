import { client } from '@/lib/api/client';

export interface PromptVariable {
  name: string;
  description?: string;
  required?: boolean;
  example?: string;
}

export interface PromptSummary {
  id: number;
  key: string;
  category: string;
  description: string | null;
  variables: PromptVariable[];
  isActive: boolean;
  currentVersion: number | null;
  defaultChecksum: string;
  currentChecksum: string | null;
  matchesDefault: boolean;
  placeholderName: string | null;
  appliesTo: string[];
  isBuiltIn: boolean;
  updatedAt: string;
}

/** Stage 2 / followup prompt keys an admin-added rule may target. */
export const SHARED_RULE_TARGET_KEYS = [
  'stage2.sale',
  'stage2.purchase',
  'stage2.expense',
  'stage2.income',
  'stage2.payment',
  'stage2.transfer',
  'stage2.adjustment',
  'stage2.query',
  'stage2.update',
  'stage2.void',
  'stage2.create_contact',
  'followup.query',
] as const;
export type SharedRuleTargetKey = (typeof SHARED_RULE_TARGET_KEYS)[number];

export interface PromptDetail extends PromptSummary {
  content: string | null;
  defaultContent: string;
}

export interface PromptVersion {
  id: number;
  version: number;
  content: string;
  changeNote: string | null;
  createdAt: string;
  createdById: number | null;
  isCurrent: boolean;
}

export interface ListPromptsQuery {
  category?: string;
  search?: string;
  isActive?: boolean;
}

export interface UpdatePromptBody {
  content: string;
  changeNote?: string;
}

export interface CreateRuleBody {
  slug: string;
  placeholderName: string;
  description?: string;
  content: string;
  appliesTo: string[];
  /** When true (default), the backend appends `{{PLACEHOLDER}}` to each target prompt. */
  autoInsertIntoPrompts?: boolean;
}

export interface UpdateAppliesToBody {
  appliesTo: string[];
  placeholderName?: string;
}

export const aiPromptsApi = {
  list(query: ListPromptsQuery = {}): Promise<PromptSummary[]> {
    return client
      .get<PromptSummary[]>('/ai-prompts', { params: query })
      .then((r) => r.data);
  },
  getById(id: number): Promise<PromptDetail> {
    return client.get<PromptDetail>(`/ai-prompts/${id}`).then((r) => r.data);
  },
  update(id: number, body: UpdatePromptBody): Promise<PromptDetail> {
    return client
      .patch<PromptDetail>(`/ai-prompts/${id}`, body)
      .then((r) => r.data);
  },
  setActive(id: number, isActive: boolean): Promise<PromptDetail> {
    return client
      .patch<PromptDetail>(`/ai-prompts/${id}/active`, { isActive })
      .then((r) => r.data);
  },
  versions(id: number): Promise<PromptVersion[]> {
    return client
      .get<PromptVersion[]>(`/ai-prompts/${id}/versions`)
      .then((r) => r.data);
  },
  restoreVersion(id: number, versionId: number): Promise<PromptDetail> {
    return client
      .post<PromptDetail>(`/ai-prompts/${id}/versions/${versionId}/restore`)
      .then((r) => r.data);
  },
  resetToDefault(id: number): Promise<PromptDetail> {
    return client
      .post<PromptDetail>(`/ai-prompts/${id}/reset-to-default`)
      .then((r) => r.data);
  },
  createRule(body: CreateRuleBody): Promise<PromptDetail> {
    return client
      .post<PromptDetail>('/ai-prompts/rules', body)
      .then((r) => r.data);
  },
  updateAppliesTo(id: number, body: UpdateAppliesToBody): Promise<PromptDetail> {
    return client
      .patch<PromptDetail>(`/ai-prompts/${id}/applies-to`, body)
      .then((r) => r.data);
  },
  delete(id: number): Promise<void> {
    return client.delete(`/ai-prompts/${id}`).then(() => undefined);
  },
};
