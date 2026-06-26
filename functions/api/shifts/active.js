import { json } from "../_lib.js";

globalThis.__MOCK_ACTIVE_SHIFT = globalThis.__MOCK_ACTIVE_SHIFT || null;

export const onRequestGet = async ({ request, env }) => {
  if (globalThis.__MOCK_ACTIVE_SHIFT) {
    return json({ ok: true, shift: globalThis.__MOCK_ACTIVE_SHIFT });
  }
  return json({ ok: false, error: "No active shift" });
};
