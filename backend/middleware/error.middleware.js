const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  const message =
    err.message || "Gözlənilməz server xətası baş verdi";
  res.status(status).json({ message });
};

module.exports = errorMiddleware;

