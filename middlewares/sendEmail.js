const nodemailer = require("nodemailer");
require("dotenv").config();

exports.sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMPT_USER,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  const mailOptions = {
    from: "SMPT_USER",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("Message sent: %s", info.messageId);
        resolve();
      }
    });
  });
};
