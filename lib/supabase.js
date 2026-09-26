import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client. The tables are private; every call goes through a
// public.salon_* function that also requires SALON_SECRET.
let client = null;

const getClient = () => {
  client ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
};

export const rpc = async (fn, args) => {
  const { data, error } = await getClient().rpc(fn, { p_key: process.env.SALON_SECRET, ...args });
  if (error) throw error;
  return data;
};
