const nodemailer = require("nodemailer")

const mailSender = async (email, title, body) => {
  // Gmail App Passwords are shown as "kmyx sayc wryp cojr" — strip any spaces
  // so a value pasted with spaces doesn't cause "Username and Password not accepted".
  const pass = (process.env.MAIL_PASS || "").replace(/\s+/g, "")

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST, // smtp.gmail.com
    port: 587,
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.MAIL_USER,
      pass,
    },
    // Fail fast instead of hanging when SMTP is unreachable (e.g. a network
    // that blocks outbound mail), so callers don't wait on a long OS timeout.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  })

  // Do NOT swallow the error here. If sending fails, let it throw so the real
  // SMTP reason (e.g. "Invalid login: 535-5.7.8 ...") surfaces in the logs and
  // the API response, instead of pretending the email was sent.
  const info = await transporter.sendMail({
    from: `"CodewithVermaji | CodeHelp" <${process.env.MAIL_USER}>`, // sender address
    to: `${email}`, // list of receivers
    subject: `${title}`, // Subject line
    html: `${body}`, // html body
  })
  console.log("Email sent:", info.messageId, "->", info.response)
  return info
}

module.exports = mailSender
