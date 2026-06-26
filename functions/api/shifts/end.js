import { json, readJson } from "../_lib.js";

export const onRequestPost = async ({ request, env }) => {
  const body = await readJson(request);
  if (globalThis.__MOCK_ACTIVE_SHIFT) {
    globalThis.__MOCK_ACTIVE_SHIFT.end_time = new Date().toISOString();
    globalThis.__MOCK_ACTIVE_SHIFT.closing_cash = body?.closingCash || 0;
    globalThis.__MOCK_ACTIVE_SHIFT.status = "closed";
  }
  const endedShift = globalThis.__MOCK_ACTIVE_SHIFT;
  globalThis.__MOCK_ACTIVE_SHIFT = null;
  
  return json({ ok: true, shift: endedShift });
};
