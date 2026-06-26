import { json, readJson } from "../_lib.js";

export const onRequestPost = async ({ request, env }) => {
  const body = await readJson(request);
  const shift = {
    id: "shift-" + Date.now(),
    opening_cash: body?.openingCash || 500000,
    start_time: new Date().toISOString(),
    status: "open",
    cashSales: 0,
    transferSales: 0,
    cardSales: 0
  };
  globalThis.__MOCK_ACTIVE_SHIFT = shift;
  return json({ ok: true, shift });
};
