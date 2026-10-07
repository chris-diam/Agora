import { prisma } from "../lib/prisma";
import { sendEmail } from "./email.service";

const DIGEST_WINDOW_DAYS = 7;

interface DigestResult {
  sentCount: number;
  skippedCount: number;
}

const renderDigestHtml = (displayName: string, events: { title: string; startDate: Date; city: string }[]): string => {
  const rows = events
    .map(
      (event) =>
        `<li style="margin-bottom:8px"><strong>${event.title}</strong><br/>${event.startDate.toLocaleString()} · ${event.city}</li>`,
    )
    .join("");
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Hi ${displayName},</h2>
      <p>Here's what's coming up this week${events[0] ? ` in ${events[0].city}` : ""}:</p>
      <ul style="list-style:none;padding:0">${rows}</ul>
      <p style="color:#888;font-size:12px">You're getting this because you're a KYMA member. You can turn this off anytime in your profile settings.</p>
    </div>
  `;
};

// Sends one digest email per opted-in user who has at least one upcoming
// event to tell them about (their own city if set, otherwise skipped
// rather than mailing every event in every city — that's noise, not a
// digest). Meant to be triggered by an external scheduler hitting the
// protected /api/newsletter/send-digest route, since there's no in-process
// cron (see env.ts's NEWSLETTER_CRON_SECRET comment for why).
export const sendUpcomingEventsDigest = async (): Promise<DigestResult> => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DIGEST_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: { emailDigestOptIn: true, city: { not: null } },
    select: { id: true, email: true, displayName: true, city: true },
  });

  let sentCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    const events = await prisma.event.findMany({
      where: { city: user.city!, startDate: { gte: now, lte: windowEnd } },
      select: { title: true, startDate: true, city: true },
      orderBy: { startDate: "asc" },
      take: 10,
    });

    if (events.length === 0) {
      skippedCount += 1;
      continue;
    }

    await sendEmail(user.email, `This week in ${user.city}`, renderDigestHtml(user.displayName, events));
    sentCount += 1;
  }

  return { sentCount, skippedCount };
};
