import "dotenv/config";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

const url = process.env.DATABASE_URL || process.env.DB_URL;
if (!url) throw new Error("DATABASE_URL/DB_URL not set");

export const pool = new Pool({ connectionString: url });

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const { rows } = await pool.query<T>(text, params);
  return rows;
}
