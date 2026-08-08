// Local dev entry: `npm run dev` runs this alongside Vite (which proxies /api).
import { app, HAS_KEY, MODEL } from "./app.js";

const PORT = 8787;
app.listen(PORT, () => {
  console.log(`\n  Mettle API  ·  http://localhost:${PORT}`);
  console.log(
    HAS_KEY
      ? `  ANTHROPIC_API_KEY loaded  ·  model ${MODEL}  ·  demo toggle available in the UI\n`
      : `  No ANTHROPIC_API_KEY — running the baked-in demo (fully offline, no key needed).\n`
  );
});
