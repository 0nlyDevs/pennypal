import "dotenv/config";
import dns from "node:dns";
import app from "./app.js";

// Prefer IPv4 to mitigate environments where IPv6 routes time out
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
