const { Pool } = require("pg");
const config = require("./env.config");

const pool = new Pool({
  connectionString: config.dbUrl,
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};

