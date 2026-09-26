import { NextResponse } from "next/server";
import { z } from "zod";
import { setStaff } from "@/lib/cookies";
import { rpc } from "@/lib/supabase";

const LoginSchema = z.object({ pin: z.string().trim().min(1).max(20) });

const clientIp = (request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

export const POST = async (request) => {
  const parsed = LoginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the staff PIN." }, { status: 400 });
  }

  try {
    const tag = await rpc("salon_staff_login", { p_pin: parsed.data.pin, p_ip: clientIp(request) });
    if (!tag) return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    setStaff(response, tag);
    return response;
  } catch (error) {
    if (error?.code === "P0002") {
      return NextResponse.json({ error: "Too many wrong tries. Wait 15 minutes." }, { status: 429 });
    }
    console.error(error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
};
