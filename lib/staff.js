import "server-only";
import { NextResponse } from "next/server";
import { getStaffTag } from "./cookies";
import { rpc } from "./supabase";

// True when this device has a valid staff session for the current PIN.
export const isStaff = async () => {
  const tag = await getStaffTag();
  if (!tag) return false;
  try {
    return Boolean(await rpc("salon_staff_check", { p_tag: tag }));
  } catch {
    return false;
  }
};

export const unauthorized = () =>
  NextResponse.json({ error: "Please enter the staff PIN." }, { status: 401 });

// Runs a staff-only database call; maps "not signed in" to 401.
export const withStaff = async (handler) => {
  const tag = await getStaffTag();
  if (!tag) return unauthorized();
  try {
    return await handler(tag);
  } catch (error) {
    if (error?.code === "28000") return unauthorized();
    console.error(error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
};
