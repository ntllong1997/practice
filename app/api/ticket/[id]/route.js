import { NextResponse } from "next/server";
import { z } from "zod";
import { rpc } from "@/lib/supabase";

// Queue position for a customer's ticket (no other customers' details).
export const GET = async (_request, { params }) => {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const status = await rpc("salon_people_ahead", { p_checkin_id: id });
    if (!status) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
};
