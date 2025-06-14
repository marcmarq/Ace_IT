import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  try {
    console.log('Attempting to send email to:', to); // Add this
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject: "Your Password Reset OTP",
      text: `Your OTP is ${otp}. Valid for 15 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. Valid for 15 minutes.</p>`,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error:', error); 
    throw error;
  }
}