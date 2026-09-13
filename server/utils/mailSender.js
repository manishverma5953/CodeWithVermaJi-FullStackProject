const nodemailer = require("nodemailer")
const https = require("https")

// Send an email through Brevo's transactional HTTPS API (port 443).
// This is required on hosts that block outbound SMTP (e.g. Render's free tier),
// where nodemailer + Gmail SMTP times out. Enabled by setting BREVO_API_KEY.
function sendViaBrevo({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: {
        email: process.env.MAIL_USER, // must be a verified sender in Brevo
        name: "CodewithVermaji | CodeHelp",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    })

    const req = https.request(
      {
        hostname: "api.brevo.com",
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let messageId
            try {
              messageId = JSON.parse(data || "{}").messageId
            } catch (_) {}
            resolve({ response: data, messageId })
          } else {
            reject(new Error(`Brevo API ${res.statusCode}: ${data}`))
          }
        })
      }
    )
    req.on("error", reject)
    req.write(payload)
    req.end()
  })
}

const mailSender = async (email, title, body) => {
  // Prefer Brevo's HTTPS API when configured (works where SMTP is blocked).
  if (process.env.BREVO_API_KEY) {
    const info = await sendViaBrevo({ to: email, subject: title, html: body })
    console.log("Email sent via Brevo:", info.messageId || info.response)
    return info
  }

  // Fallback: SMTP via nodemailer (local dev, or hosts that allow SMTP).
  // Gmail App Passwords are shown as "kmyx sayc wryp cojr" — strip any spaces.
  const pass = (process.env.MAIL_PASS || "").replace(/\s+/g, "")
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST, // smtp.gmail.com
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.MAIL_USER,
      pass,
    },
    // Fail fast instead of hanging when SMTP is unreachable.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  })

  const info = await transporter.sendMail({
    from: `"CodewithVermaji | CodeHelp" <${process.env.MAIL_USER}>`,
    to: `${email}`,
    subject: `${title}`,
    html: `${body}`,
  })
  console.log("Email sent:", info.messageId, "->", info.response)
  return info
}

module.exports = mailSender
