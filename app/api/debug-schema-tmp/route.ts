import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

// Rota temporaria so pra inspecionar o schema do Supabase ja conectado.
// Removida assim que a investigacao terminar.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.DOWNLOAD_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "sem POSTGRES_URL configurada" }, { status: 500 });
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();

    const tables = await client.query(`
      select table_schema, table_name
      from information_schema.tables
      where table_schema not in ('pg_catalog', 'information_schema', 'pg_toast', 'auth', 'storage', 'realtime', 'vault', 'extensions', 'graphql', 'graphql_public', 'pgsodium', 'pgsodium_masks', 'supabase_functions', 'supabase_migrations', 'cron')
      order by table_schema, table_name;
    `);

    const columnsByTable: Record<string, unknown[]> = {};
    for (const row of tables.rows) {
      const cols = await client.query(
        `select column_name, data_type, is_nullable, column_default
         from information_schema.columns
         where table_schema = $1 and table_name = $2
         order by ordinal_position;`,
        [row.table_schema, row.table_name]
      );
      columnsByTable[`${row.table_schema}.${row.table_name}`] = cols.rows;
    }

    const policies = await client.query(`
      select schemaname, tablename, policyname, permissive, roles, cmd
      from pg_policies
      where schemaname = 'public';
    `);

    const enums = await client.query(`
      select t.typname as enum_name, e.enumlabel as value
      from pg_type t
      join pg_enum e on t.oid = e.enumtypid
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      order by t.typname, e.enumsortorder;
    `);

    return NextResponse.json({
      tables: tables.rows,
      columns: columnsByTable,
      policies: policies.rows,
      enums: enums.rows,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await client.end();
  }
}
