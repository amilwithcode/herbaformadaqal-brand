const app = require("./app");
const config = require("./config/env.config");

app.listen(config.port, () => {
  console.log(`Backend server dinləyir: http://localhost:${config.port}`);
});

