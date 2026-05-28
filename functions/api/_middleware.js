// Global middleware for all /api/* routes.
// - Adds permissive CORS so the static frontend can call /api/ from the same
//   Pages domain or from localhost during development.
// - Catches uncaught errors and turns them into JSON 500 responses.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Op-Id",
  "Access-Control-Max-Age": "86400",
};

export const onRequest = async (context) => {
  const { request, next } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const response = await next();
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err && err.message ? err.message : String(err),
        stack: err && err.stack ? String(err.stack).split("\n").slice(0, 5) : undefined,
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
};
