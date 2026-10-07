import { Resend } from "resend";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

let client: Resend | null = null;

const getClient = (): Resend => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw new AppError("Email sending is not configured on this server", 503);
  }
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
};

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL!,
    to,
    subject,
    html,
  });
  if (error) throw new AppError(`Could not send email: ${error.message}`, 502);
};
