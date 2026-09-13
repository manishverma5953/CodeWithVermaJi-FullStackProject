const { contactUsEmail } = require("../mail/templates/contactFormRes")
const mailSender = require("../utils/mailSender")
const ContactMessage = require("../models/ContactMessage")

exports.contactUsController = async (req, res) => {
  const { email, firstname, lastname, message, phoneNo, countrycode } = req.body
  try {
    // 1) Save the submission so the owner always has a durable record,
    //    even if the notification email happens to fail.
    await ContactMessage.create({
      firstName: firstname,
      lastName: lastname,
      email,
      countrycode,
      phoneNo,
      message,
    })

    // 2) Notify the site owner with the full inquiry. Recipient is configurable
    //    via CONTACT_MAIL_TO, defaulting to the account's own address.
    const adminRecipient = process.env.CONTACT_MAIL_TO || process.env.MAIL_USER
    if (adminRecipient) {
      try {
        await mailSender(
          adminRecipient,
          `New Contact Form Submission from ${firstname} ${lastname}`,
          `<h2>New contact form submission</h2>
           <p><b>Name:</b> ${firstname} ${lastname}</p>
           <p><b>Email:</b> ${email}</p>
           <p><b>Phone:</b> ${countrycode || ""} ${phoneNo || ""}</p>
           <p><b>Message:</b></p>
           <p>${message}</p>`
        )
      } catch (adminErr) {
        console.log("Admin contact notification failed:", adminErr.message)
      }
    }

    // 3) Send the submitter a confirmation (best-effort; must not fail the request).
    try {
      await mailSender(
        email,
        "We received your message",
        contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
      )
    } catch (ackErr) {
      console.log("Submitter confirmation email failed:", ackErr.message)
    }

    return res.json({
      success: true,
      message: "Message sent successfully",
    })
  } catch (error) {
    console.log("Contact form error:", error.message)
    return res.json({
      success: false,
      message: "Something went wrong...",
    })
  }
}
