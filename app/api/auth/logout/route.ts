import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // Create a new response
  const response = NextResponse.json({ success: true });
  
  // Delete the session cookie
  response.cookies.delete('session');
  
  return response;
} 