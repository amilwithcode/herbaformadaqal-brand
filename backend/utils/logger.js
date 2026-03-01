const morgan = require("morgan");

const httpLogger = morgan("dev");

module.exports = {
  httpLogger,
};

