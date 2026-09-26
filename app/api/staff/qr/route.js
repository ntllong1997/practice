import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { withStaff } from "@/lib/staff";
import { rpc } from "@/lib/supabase";
import { currentQrToken } from "@/lib/tokens";

// Current rotating check-in link for the front-desk screen.
export const GET = (request) =>
  withStaff(async (tag) => {
    if (!(await rpc("salon_staff_check", { p_tag: tag }))) {
      return NextResponse.json({ error: "Please enter the staff PIN." }, { status: 401 });
    }
    const { token, secondsLeft } = currentQrToken();
    const url = new URL(`/enter?k=${token}`, request.url).toString();
    const image = await QRCode.toDataURL(url, { width: 640, margin: 1, errorCorrectionLevel: "M" });
    return NextResponse.json({ url, image, secondsLeft }, { headers: { "Cache-Control": "no-store" } });
  });
