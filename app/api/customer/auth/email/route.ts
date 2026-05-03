import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with Resend or your email service to send OTP
    // For now, we'll just create a session
    
    return NextResponse.json(
      { message: "OTP sent to your email", email },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email auth error:", error);
    return NextResponse.json(
      { error: "Failed to process email login" },
      { status: 500 }
    );
  }
}
