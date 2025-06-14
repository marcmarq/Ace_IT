import { NextRequest, NextResponse } from "next/server";
import { sendResetOtp, resetPassword } from "@/lib/actions/auth.action";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const result = await sendResetOtp(email);

    if (!result?.success) {
      return NextResponse.json(
        { message: result?.message || "Failed to send OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();
    
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const result = await resetPassword(email, otp, newPassword);

    if (!result?.success) {
      return NextResponse.json(
        { message: result?.message || "Failed to reset password" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}