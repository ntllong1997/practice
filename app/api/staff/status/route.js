import { NextResponse } from "next/server";
import { z } from "zod";
import { withStaff } from "@/lib/staff";
import { rpc } from "@/lib/supabase";

const Status = z.enum(["waiting", "in_progress", "done"]);
const StatusSchema = z.object({ serviceId: z.uuid(), from: Status, to: Status });

export const POST = async (request) => {
  const parsed = StatusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { serviceId, from, to } = parsed.data;

  return withStaff(async (tag) => {
    const updated = await rpc("salon_staff_set_status", {
      p_tag: tag,
      p_service_id: serviceId,
      p_from: from,
      p_to: to,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Someone else just changed this. The list has been refreshed." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true });
  });
};
