import "dotenv/config";
import { createApp } from "./app";

const PORT = parseInt(process.env.PORT || "3000", 10);

async function main() {
  const app = createApp();
  app.listen(PORT, () => console.log(`[api] http://localhost:${PORT}`));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
