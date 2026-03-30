require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function test() {
  try {
    console.log(`Authenticating as: ${process.env.EMAIL_USER}`);
    console.log(`Password length: ${process.env.EMAIL_PASS?.length}`);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test email",
      text: "This is a test to verify Nodemailer functioning."
    });
    console.log("Success! Sent mail:", info.messageId);
  } catch (err) {
    console.error("DEBUG NODEMAILER ERROR:");
    console.error(err);
  }
}
test();
