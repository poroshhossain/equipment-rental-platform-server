import "dotenv/config.js";
import app from "./app.js";
import { startCronJobs } from "./jobs/cron.js";

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startCronJobs();
});
