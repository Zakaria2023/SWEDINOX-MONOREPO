"use server";

import { createElement } from "react";

import CompanyWelcomeEmail from "@/emails/templates/company-welcome-email";
import { sendEmail } from "@/emails/resend";

export type WelcomeEmailResult = {
  sent: number;
  failed: number;
};

/**
 * Sends the company welcome email to each contact address individually, so
 * recipients never see each other's addresses. Failures are counted rather
 * than thrown — a bounced welcome email must not block company creation.
 */
export const sendCompanyWelcomeEmails = async (
  companyName: string,
  contactEmails: string[],
): Promise<WelcomeEmailResult> => {
  const uniqueEmails = [...new Set(contactEmails.filter(Boolean))];

  if (uniqueEmails.length === 0) {
    console.warn(`No contact emails provided for company "${companyName}".`);
    return { sent: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    uniqueEmails.map((email) =>
      sendEmail({
        to: email,
        subject: `Welcome to Swedinox, ${companyName}!`,
        react: createElement(CompanyWelcomeEmail, { companyName }),
      }),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent: results.length - failed, failed };
};
