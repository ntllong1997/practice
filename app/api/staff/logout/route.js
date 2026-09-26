import { NextResponse } from "next/server";
import { clearStaff } from "@/lib/cookies";

export const POST = () => {
  const response = NextResponse.json({ ok: true });
  clearStaff(response);
  return response;
};
