function trimTrailingSemicolon(sql) {
  return String(sql || "").trim().replace(/;+\s*$/, "");
}

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${escapeSqlString(value)}'`;
}

function interpolateParams(sql, params) {
  let index = 0;
  return String(sql).replace(/\?/g, () => {
    if (index >= params.length) return "?";
    const value = params[index];
    index += 1;
    return sqlLiteral(value);
  });
}

function normalizeSql(sql) {
  let out = trimTrailingSemicolon(sql);

  const pragmaTable = out.match(/^PRAGMA\s+table_info\(([^)]+)\)$/i);
  if (pragmaTable) {
    const tableName = pragmaTable[1].replace(/['"`]/g, "").trim();
    return [
      "SELECT column_name AS name",
      "FROM information_schema.columns",
      `WHERE table_schema = 'public' AND table_name = ${sqlLiteral(tableName)}`,
      "ORDER BY ordinal_position"
    ].join(" ");
  }

  if (/^PRAGMA\s+defer_foreign_keys\s*=/i.test(out)) {
    return "";
  }

  out = out
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, "INSERT INTO")
    .replace(/\bCOLLATE\s+NOCASE\b/gi, "")
    .replace(/\bjson_group_array\s*\(/gi, "json_agg(")
    .replace(/\bjson_object\s*\(/gi, "json_build_object(")
    .replace(/strftime\('%Y-%m-%d',\s*created_at\/1000,\s*'unixepoch'\)/gi, "to_char(to_timestamp(created_at / 1000.0), 'YYYY-MM-DD')")
    .replace(/\bMAX\(0,\s*COALESCE\(([^)]+)\)\s*-\s*([^)]+)\)/gi, "GREATEST(0, COALESCE($1) - $2)")
    .replace(/\bORDER\s+BY\s+rowid\b/gi, "ORDER BY id");

  if (/^INSERT\s+INTO\s+inventory\b/i.test(out) && !/\bON\s+CONFLICT\b/i.test(out)) {
    out += " ON CONFLICT (product_id) DO NOTHING";
  }

  return out;
}

function isReturningQuery(sql) {
  const trimmed = String(sql || "").trim().toLowerCase();
  return trimmed.startsWith("select") ||
    trimmed.startsWith("with") ||
    /\breturning\b/i.test(trimmed);
}

async function callSupabaseRpc(env, fn, payload) {
  const url = getSupabaseUrl(env);
  const key = getSupabaseServiceRoleKey(env);
  if (!url || !key) {
    throw new Error("Supabase env missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "apikey": key
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }
  if (!response.ok) {
    const error = new Error((data && (data.message || data.error)) || `Supabase RPC ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

class SupabaseStatement {
  constructor(env, sql) {
    this.env = env;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  toSql() {
    return normalizeSql(interpolateParams(this.sql, this.params));
  }

  async all() {
    const sql = this.toSql();
    if (!sql) return { results: [] };
    const rows = await callSupabaseRpc(this.env, "shopflow_query", { sql });
    return { results: Array.isArray(rows) ? rows : [] };
  }

  async first() {
    const { results } = await this.all();
    return results && results.length ? results[0] : null;
  }

  async run() {
    const sql = this.toSql();
    if (!sql) return { success: true };
    if (isReturningQuery(sql)) {
      await callSupabaseRpc(this.env, "shopflow_query", { sql });
    } else {
      await callSupabaseRpc(this.env, "shopflow_exec", { sql });
    }
    return { success: true };
  }
}

export function shouldUseSupabase(env) {
  const provider = String(env.SHOPFLOW_DB_PROVIDER || "").toLowerCase();
  return provider === "supabase" || Boolean(getSupabaseUrl(env) && getSupabaseServiceRoleKey(env) && provider !== "d1");
}

export function createSupabaseD1Adapter(env) {
  return {
    __provider: "supabase",
    prepare(sql) {
      return new SupabaseStatement(env, sql);
    },
    async batch(statements) {
      const sqls = statements
        .map((statement) => typeof statement.toSql === "function" ? statement.toSql() : "")
        .filter(Boolean);
      if (!sqls.length) return [];
      await callSupabaseRpc(env, "shopflow_exec_batch", { statements: sqls });
      return sqls.map(() => ({ success: true }));
    }
  };
}

export function getRuntimeDb(env) {
  if (shouldUseSupabase(env)) {
    return createSupabaseD1Adapter(env);
  }
  return env.DB;
}

export function getDbProvider(env) {
  return shouldUseSupabase(env) ? "supabase" : "d1";
}

export function getSupabaseUrl(env) {
  return String(
    env.SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_PROJECT_URL ||
    ""
  ).replace(/\/+$/, "");
}

export function getSupabaseHost(env) {
  try {
    return new URL(getSupabaseUrl(env)).host;
  } catch (_) {
    return "";
  }
}

export function getSupabaseServiceRoleKey(env) {
  return env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.SUPABASE_SECRET_KEY ||
    env.SERVICE_ROLE_KEY ||
    "";
}
