import { client } from '@/lib/api/client';

export interface TemplateVariable {
  name: string;
  description?: string;
  example?: string;
}

export interface InlineButton {
  text: string;
  url: string;
}

export interface TemplateContent {
  contentUz: string;
  contentRu: string;
  contentEn: string;
  mediaType: 'photo' | 'video' | 'document' | null;
  mediaUrl: string | null;
  inlineButtons: InlineButton[][];
}

export interface TemplateSummary {
  id: number;
  key: string;
  category: string;
  description: string | null;
  variables: TemplateVariable[];
  hasMedia: boolean;
  hasButtons: boolean;
  isActive: boolean;
  currentVersion: number | null;
  updatedAt: string;
}

export interface TemplateDetail extends TemplateSummary {
  current: TemplateContent | null;
}

export interface TemplateVersion extends TemplateContent {
  id: number;
  version: number;
  changeNote: string | null;
  createdAt: string;
  createdById: number | null;
  isCurrent: boolean;
}

export interface ListTemplatesQuery {
  category?: string;
  search?: string;
  isActive?: boolean;
}

export interface UpdateTemplateBody {
  contentUz: string;
  contentRu: string;
  contentEn: string;
  mediaType?: 'photo' | 'video' | 'document' | null;
  mediaUrl?: string | null;
  inlineButtons?: { buttons: InlineButton[] }[];
  changeNote?: string;
}

export const botTemplatesApi = {
  list(query: ListTemplatesQuery = {}): Promise<TemplateSummary[]> {
    return client
      .get<TemplateSummary[]>('/bot-templates', { params: query })
      .then((r) => r.data);
  },
  getById(id: number): Promise<TemplateDetail> {
    return client.get<TemplateDetail>(`/bot-templates/${id}`).then((r) => r.data);
  },
  update(id: number, body: UpdateTemplateBody): Promise<TemplateDetail> {
    return client
      .patch<TemplateDetail>(`/bot-templates/${id}`, body)
      .then((r) => r.data);
  },
  setActive(id: number, isActive: boolean): Promise<TemplateDetail> {
    return client
      .patch<TemplateDetail>(`/bot-templates/${id}/active`, { isActive })
      .then((r) => r.data);
  },
  versions(id: number): Promise<TemplateVersion[]> {
    return client
      .get<TemplateVersion[]>(`/bot-templates/${id}/versions`)
      .then((r) => r.data);
  },
  restoreVersion(id: number, versionId: number): Promise<TemplateDetail> {
    return client
      .post<TemplateDetail>(`/bot-templates/${id}/versions/${versionId}/restore`)
      .then((r) => r.data);
  },
};
