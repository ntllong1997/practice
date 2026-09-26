import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { withStaff } from "@/lib/staff";
import { rpc } from "@/lib/supabase";
import { checkinToken } from "@/lib/tokens";

// The check-in QR code to print and put at the front desk.
export const GET = (request) =>
  withStaff(async (tag) => {
    if (!(await rpc("salon_staff_check", { p_tag: tag }))) {
      return NextResponse.json({ error: "Please enter the staff PIN." }, { status: 401 });
    }
    const url = new URL(`/enter?k=${checkinToken()}`, request.url).toString();
    const image = await QRCode.toDataURL(url, { width: 1024, margin: 1, errorCorrectionLevel: "M" });
    return NextResponse.json({ url, image }, { headers: { "Cache-Control": "no-store" } });
  });
