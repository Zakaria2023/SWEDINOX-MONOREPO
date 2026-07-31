import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  getCloudflareR2,
  getCloudflareR2BucketName,
} from "@/lib/server/cloudflare-r2";
import { createDocumentObjectKey } from "@/lib/server/document-storage";

export const DELETE = async (
  _req: Request,
  context: { params: Promise<{ documentId: string }> },
) => {
  try {
    const { documentId } = await context.params;

    await getCloudflareR2().send(
      new DeleteObjectCommand({
        Bucket: getCloudflareR2BucketName(),
        Key: createDocumentObjectKey(documentId),
      }),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return Response.json({ error: "Failed to delete document" }, { status: 500 });
  }
};
