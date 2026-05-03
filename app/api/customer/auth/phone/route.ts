import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with Twilio or your SMS service to send OTP
    // For now, we'll just return success
    
    return NextResponse.json(
      { message: "OTP sent to your phone", phone },
      { status: 200 }
    );
  } catch (error) {
    console.error("Phone auth error:", error);
    return NextResponse.json(
      { error: "Failed to process phone login" },
      { status: 500 }
    );
  }
}
