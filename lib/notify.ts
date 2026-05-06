import { Resend } from "resend";
import twilio from "twilio";

export async function sendEmail(subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;
  const to = process.env.ALERT_TO_EMAIL;
  if (!key || !from || !to) throw new Error("Missing Resend env vars: RESEND_API_KEY, ALERT_FROM_EMAIL, ALERT_TO_EMAIL");
  const resend = new Resend(key);
  return resend.emails.send({ from, to, subject, text });
}

export async function sendSms(text: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;
  const to = process.env.ALERT_TO_PHONE;
  if (!sid || !token || !from || !to) throw new Error("Missing Twilio env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE, ALERT_TO_PHONE");
  const client = twilio(sid, token);
  return client.messages.create({ from, to, body: text.slice(0, 1500) });
}

export async function sendBoth(subject: string, text: string) {
  const results: any = {};
  results.email = await sendEmail(subject, text);
  results.sms = await sendSms(`${subject}\n${text}`);
  return results;
}
