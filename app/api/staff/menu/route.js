import { NextResponse } from "next/server";
import { z } from "zod";
import { withStaff } from "@/lib/staff";
import { rpc } from "@/lib/supabase";

const Name = z.string().trim().min(1).max(40);
const AddSchema = z.object({ category: z.enum(["pedicure", "nails"]), name: Name });
const RenameSchema = z.object({ id: z.uuid(), name: Name });
const RemoveSchema = z.object({ id: z.uuid() });

const badRequest = (error = "Service name must be 1–40 characters.") =>
  NextResponse.json({ error }, { status: 400 });

const parse = async (request, schema) => schema.safeParse(await request.json().catch(() => ({})));

// Maps "already exists" to a friendly 409; other errors go to withStaff.
const saving = async (work) => {
  try {
    return await work();
  } catch (error) {
    if (error?.code === "P0003") {
      return NextResponse.json({ error: "That service already exists." }, { status: 409 });
    }
    throw error;
  }
};

export const GET = () =>
  withStaff(async (tag) => {
    if (!(await rpc("salon_staff_check", { p_tag: tag }))) {
      return NextResponse.json({ error: "Please enter the staff PIN." }, { status: 401 });
    }
    const menu = await rpc("salon_menu", {});
    return NextResponse.json({ menu }, { headers: { "Cache-Control": "no-store" } });
  });

export const POST = async (request) => {
  const parsed = await parse(request, AddSchema);
  if (!parsed.success) return badRequest();
  return withStaff((tag) =>
    saving(async () => {
      const item = await rpc("salon_staff_menu_add", {
        p_tag: tag,
        p_category: parsed.data.category,
        p_name: parsed.data.name,
      });
      return NextResponse.json({ item });
    })
  );
};

export const PATCH = async (request) => {
  const parsed = await parse(request, RenameSchema);
  if (!parsed.success) return badRequest();
  return withStaff((tag) =>
    saving(async () => {
      await rpc("salon_staff_menu_rename", { p_tag: tag, p_id: parsed.data.id, p_name: parsed.data.name });
      return NextResponse.json({ ok: true });
    })
  );
};

export const DELETE = async (request) => {
  const parsed = await parse(request, RemoveSchema);
  if (!parsed.success) return badRequest("Bad request");
  return withStaff(async (tag) => {
    await rpc("salon_staff_menu_remove", { p_tag: tag, p_id: parsed.data.id });
    return NextResponse.json({ ok: true });
  });
};
