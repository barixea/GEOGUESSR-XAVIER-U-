import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAllLocations } from '@/lib/locations';

export const runtime = 'nodejs';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Issues a scoped, short-lived Blob upload token. The browser uploads
 * directly to Blob storage — Vercel serverless functions cap request
 * bodies at 4.5 MB, and phone photos routinely exceed that.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Re-verify here: the client controls both pathname and payload.
        const session = await requireAdmin();
        if (!session) throw new Error('Unauthorized');

        const match = /^buildings\/([a-z0-9-]+)\/hero\.[a-z0-9]+$/.exec(pathname);
        const locations = await getAllLocations();
        if (!match || !locations.some((location) => location.id === match[1])) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60 * 60 * 24 * 30,
          tokenPayload: JSON.stringify({
            buildingId: match[1],
            uploadedBy: session.sub ?? 'admin',
            caption: typeof clientPayload === 'string' ? clientPayload.slice(0, 200) : null,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Intentionally a no-op: this webhook cannot reach localhost, so the
        // DB write lives in POST /api/admin/photos which works in both envs.
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 400 });
  }
}
