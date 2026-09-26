import { NextResponse } from "next/server";
import { setEntry } from "@/lib/cookies";
import { isValidQrToken, newNonce } from "@/lib/tokens";

// Target of the printed QR code. Scanning gives this phone a short-lived,
// one-use check-in pass (cookie) and sends it to the clean home URL, so the
// link in the address bar can't be copied and shared.
export const GET = (request) => {
  const token = request.nextUrl.searchParams.get("k");
  const home = new URL("/", request.url);

  if (!isValidQrToken(token)) {
    home.searchParams.set("expired", "1");
    return NextResponse.redirect(home, 303);
  }

  const response = NextResponse.redirect(home, 303);
  setEntry(response, newNonce());
  return response;
};
