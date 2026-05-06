import { NextResponse } from "next/server";
import { sendBoth } from "@/lib/notify";

export async function POST() {
  try {
    const subject = "Mountain Window test alert";
    const text = "This is a test alert from your Mountain Window app. If you received this email and SMS, Resend and Twilio are configured correctly.";
    const result = await sendBoth(subject, text);
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
