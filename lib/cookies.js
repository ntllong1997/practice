import "server-only";
import { cookies } from "next/headers";
import { ENTRY_TTL_SECONDS, STAFF_TTL_SECONDS, readSignedValue, signValue } from "./tokens";

const ENTRY_COOKIE = "salon_entry";
const STAFF_COOKIE = "salon_staff";

const baseOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const getEntry = async () => readSignedValue((await cookies()).get(ENTRY_COOKIE)?.value);

export const setEntry = (response, nonce) =>
  response.cookies.set(ENTRY_COOKIE, signValue({ n: nonce }, ENTRY_TTL_SECONDS), {
    ...baseOptions,
    maxAge: ENTRY_TTL_SECONDS,
  });

export const clearEntry = (response) => response.cookies.delete(ENTRY_COOKIE);

export const getStaffTag = async () =>
  readSignedValue((await cookies()).get(STAFF_COOKIE)?.value)?.t ?? null;

export const setStaff = (response, tag) =>
  response.cookies.set(STAFF_COOKIE, signValue({ t: tag }, STAFF_TTL_SECONDS), {
    ...baseOptions,
    maxAge: STAFF_TTL_SECONDS,
  });

export const clearStaff = (response) => response.cookies.delete(STAFF_COOKIE);
