import "server-only";

import type { ReactElement } from "react";
import { Resend } from "resend";

/**
 * Reads a required environment variable, throwing at startup if it is missing
 * rather than silently failing at the point of use.
 */
const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

/**
 * Pre-configured Resend client for sending transactional email.
 *
 * Configuration is read from environment variables at module initialisation
 * time so the app fails fast if any are absent:
 *   RESEND_API_KEY    — API key from https://resend.com/api-keys
 *   RESEND_FROM_EMAIL — sender address on a domain verified in Resend,
 *                       e.g. "Swedinox <noreply@swedinox.com>"
 */
export const resend = new Resend(requiredEnv("RESEND_API_KEY"));

const RESEND_FROM_EMAIL = requiredEnv("RESEND_FROM_EMAIL");

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  /** A React Email template element, e.g. <ExampleEmail recipientName="..." /> */
  react: ReactElement;
  replyTo?: string;
}

/**
 * Renders a React Email template and sends it via Resend from the
 * configured sender address. Throws if Resend reports an error so callers
 * surface failures instead of silently dropping mail.
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject,
    react,
    replyTo,
  });

  if (error) {
    throw new Error(`Failed to send email "${subject}": ${error.message}`);
  }

  return data;
}
