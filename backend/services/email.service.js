const nodemailer = require("nodemailer");
const config = require("../config/env.config");

const createTransport = () => {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

const sendMail = async ({ to, subject, html }) => {
  const transport = createTransport();
  if (!transport) {
    return;
  }
  await transport.sendMail({
    from: config.emailFrom,
    to,
    subject,
    html,
  });
};

module.exports = {
  sendMail,
};

