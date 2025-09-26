import "dotenv/config";
import { pool } from "../src/db/pool";

(async () => {
  const r = await pool.query(
    "select now() as now, current_database() as db, version() as v",
  );
  console.log(r.rows[0]);
  await pool.end();
})();
