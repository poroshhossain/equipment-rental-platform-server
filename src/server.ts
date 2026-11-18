import app from "./app.js";
import "dotenv/config.js";


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});