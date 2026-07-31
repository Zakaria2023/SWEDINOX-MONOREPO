import { PutObjectCommand } from "@aws-sdk/client-s3";
import { generateUuid } from "@/lib/helpers";
import {
  getCloudflareR2,
  getCloudflareR2BucketName,
} from "@/lib/server/cloudflare-r2";
import {
  createDocumentObjectKey,
  isAllowedDocumentType,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/server/document-storage";

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!isAllowedDocumentType(file.type)) {
      return Response.json({ error: "File type not allowed" }, { status: 400 });
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return Response.json({ error: "File too large" }, { status: 400 });
    }

    const documentId = generateUuid();
    const buffer = await file.arrayBuffer();

    await getCloudflareR2().send(
      new PutObjectCommand({
        Bucket: getCloudflareR2BucketName(),
        Key: createDocumentObjectKey(documentId),
        Body: Buffer.from(buffer),
        ContentType: file.type,
      }),
    );

    return Response.json({ documentId, fileName: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to upload document:", error);
    return Response.json({ error: message }, { status: 500 });
  }
};
