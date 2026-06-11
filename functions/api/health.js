import { json } from "./_lib.js";
import {
  getDbProvider,
  getSupabaseHost,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "./_supabase_db.js";

export const onRequestGet = async ({ env }) => {
  const provider = getDbProvider(env);
  const checks = {
    supabaseUrl: Boolean(getSupabaseUrl(env)),
    supabaseHost: getSupabaseHost(env),
    supabaseServiceRoleKey: Boolean(getSupabaseServiceRoleKey(env)),
    d1Binding: Boolean(env.DB),
  };

  let ok = true;
  let error = null;
  let errorStatus = null;
  let errorData = null;
  try {
    const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM products").first();
    checks.products = Number(row && row.count) || 0;
  } catch (err) {
    ok = false;
    error = err && err.message ? err.message : String(err);
    errorStatus = err && err.status ? err.status : null;
    if (err && err.data) {
      errorData = typeof err.data === "string"
        ? err.data.slice(0, 500)
        : err.data;
    }
  }

  return json({
    ok,
    dbProvider: provider,
    checks,
    error,
    errorStatus,
    errorData,
    serverTime: Date.now(),
  }, { status: ok ? 200 : 500 });
};
