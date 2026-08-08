// Vercel serverless entry. vercel.json rewrites every /api/* request here;
// the Express app then routes on the original path (/api/tickets, /api/run…).
// With no ANTHROPIC_API_KEY env var set in Vercel, it serves the baked-in
// demo only and the UI locks its toggle to "Demo".
import { app } from "../server/app.js";

export default app;
