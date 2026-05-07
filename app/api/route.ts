import { NextResponse } from "next/server";
import { Resend } from "resend";
import twilio from "twilio";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, phone, message } = await req.json();

    // Send Email
    if (email) {
      await resend.emails.send({
        from: process.env.ALERT_FROM_EMAIL!,
        to: email,
        subject: "Mountain Window Alert",
        html: `<p>${message}</p>`,
      });
    }

    // Send SMS
    if (phone) {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );

      await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_PHONE!,
        to: phone,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send alert" },
      { status: 500 }
    );
  }
}
