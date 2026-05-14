import { client } from './client';

export interface UploadedMedia {
  url: string;
  mimeType: string;
  size: number;
  category: 'photo' | 'video' | 'document';
}

/**
 * Upload a media file to the shared admin uploads endpoint.
 * Used by the broadcast composer and the bot-template editor.
 */
export function uploadAdminMedia(file: File): Promise<UploadedMedia> {
  const form = new FormData();
  form.append('file', file);
  // No Content-Type header — axios sets the multipart boundary automatically.
  return client
    .post<UploadedMedia>('/broadcasts/uploads', form)
    .then((r) => r.data);
}
