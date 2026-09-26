import { NextResponse } from "next/server";
import { withStaff } from "@/lib/staff";
import { rpc } from "@/lib/supabase";

export const GET = () =>
  withStaff(async (tag) => {
    const customers = await rpc("salon_staff_today", { p_tag: tag });
    return NextResponse.json({ customers }, { headers: { "Cache-Control": "no-store" } });
  });
