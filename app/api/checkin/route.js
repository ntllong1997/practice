import { NextResponse } from "next/server";
import { z } from "zod";
import { clearEntry, getEntry } from "@/lib/cookies";
import { rpc } from "@/lib/supabase";

const CheckInSchema = z.object({
  name: z.string().trim().max(40).optional().default(""),
  services: z.array(z.enum(["pedicure", "nails"])).min(1).max(2),
});

export const POST = async (request) => {
  const entry = await getEntry();
  if (!entry?.n) {
    return NextResponse.json(
      { error: "Please scan the QR code at the front desk to check in.", code: "scan" },
      { status: 403 }
    );
  }

  const parsed = CheckInSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose at least one service." }, { status: 400 });
  }

  try {
    const ticket = await rpc("salon_check_in", {
      p_nonce: entry.n,
      p_name: parsed.data.name,
      p_services: parsed.data.services,
    });
    const response = NextResponse.json({ ticket });
    clearEntry(response);
    return response;
  } catch (error) {
    if (error?.code === "P0001") {
      const response = NextResponse.json(
        { error: "You already checked in with this scan. Scan the QR code again for a new check-in.", code: "scan" },
        { status: 409 }
      );
      clearEntry(response);
      return response;
    }
    console.error(error);
    return NextResponse.json({ error: "Could not check in. Please try again." }, { status: 500 });
  }
};
