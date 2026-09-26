import { NextResponse } from "next/server";
import { z } from "zod";
import { withStaff } from "@/lib/staff";
import { rpc } from "@/lib/supabase";

const CancelSchema = z.object({ checkinId: z.uuid() });

export const POST = async (request) => {
  const parsed = CancelSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  return withStaff(async (tag) => {
    await rpc("salon_staff_cancel", { p_tag: tag, p_checkin_id: parsed.data.checkinId });
    return NextResponse.json({ ok: true });
  });
};
