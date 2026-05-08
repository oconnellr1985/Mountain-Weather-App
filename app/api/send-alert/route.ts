import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { email, message } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    if (!process.env.ALERT_FROM_EMAIL) {
      return NextResponse.json(
        { error: "Missing ALERT_FROM_EMAIL" },
        { status: 500 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "No destination email provided" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.ALERT_FROM_EMAIL,
      to: email,
      subject: "Mountain Window Test Alert",
      text: message || "Mountain Window test alert.",
      html: `<p>${message || "Mountain Window test alert."}</p>`,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Resend failed", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.data?.id,
      message: "Email sent through Resend",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send email alert" },
      { status: 500 }
    );
  }
}
