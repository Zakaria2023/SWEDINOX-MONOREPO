import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

/**
 * Reads a required environment variable, throwing rather than silently failing
 * at the point of use.
 */
const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Holds the one client across calls. A box rather than a reassigned binding, so
// the module has no mutable top-level variable.
const cached: { client: S3Client | undefined } = { client: undefined };

/**
 * The S3 client pointed at Cloudflare R2, built on first use and reused after.
 *
 * Deliberately lazy. Reading the credentials while this module is evaluated
 * would make merely importing it — which the production build does when it
 * collects page data for the document routes — fail on a machine that has no
 * R2 secrets, even though nothing is being uploaded. Nothing touches R2 outside
 * a request, so nothing needs the credentials until one arrives.
 *
 *   R2_ENDPOINT          — the account-scoped R2 endpoint URL
 *   R2_ACCESS_KEY_ID     — R2 API token access key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 */
export const getCloudflareR2 = (): S3Client => {
  if (!cached.client) {
    cached.client = new S3Client({
      region: "auto",
      endpoint: requiredEnv("R2_ENDPOINT"),
      forcePathStyle: true,
      credentials: {
        accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return cached.client;
};

/**
 * The R2 bucket this app reads from and writes to, from R2_BUCKET_NAME. Read on
 * call for the same reason the client is built on call.
 */
export const getCloudflareR2BucketName = (): string =>
  requiredEnv("R2_BUCKET_NAME");
