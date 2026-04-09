const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Secrets configured via: firebase functions:secrets:set EMAIL_USER / EMAIL_PASS
const emailUser = defineSecret("EMAIL_USER");
const emailPass = defineSecret("EMAIL_PASS");

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://hobackclub.com",
  "https://www.hobackclub.com",
  "http://localhost:4321", // Astro dev server
  "http://localhost:3000",
];

// Recipient for all form submissions
const NOTIFY_EMAIL = "info@hobackclub.com";

// ─── Helper: CORS headers ────────────────────────────────────────────────────
function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

// ─── Helper: Validate required fields ────────────────────────────────────────
function validateFields(body, required) {
  const missing = required.filter((f) => !body[f] || String(body[f]).trim() === "");
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }
  return null;
}

// ─── Helper: Basic email format check ────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Helper: Sanitize input ──────────────────────────────────────────────────
function sanitize(str) {
  if (!str) return "";
  return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

// ─── Helper: Send email ──────────────────────────────────────────────────────
async function sendEmail(subject, htmlBody) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser.value(),
      pass: emailPass.value(),
    },
  });

  await transporter.sendMail({
    from: `"Hoback Club Website" <${emailUser.value()}>`,
    to: NOTIFY_EMAIL,
    subject,
    html: htmlBody,
  });
}

// ─── Helper: Build styled email HTML ─────────────────────────────────────────
function buildEmailHtml(title, fields) {
  const rows = fields
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding: 10px 16px; font-family: 'Lato', Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: #1e2d3a; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e8e4df; width: 140px; vertical-align: top;">
        ${label}
      </td>
      <td style="padding: 10px 16px; font-family: 'Lato', Helvetica, sans-serif; font-size: 14px; color: #666; line-height: 1.6; border-bottom: 1px solid #e8e4df;">
        ${value}
      </td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f7f5f2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f5f2; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 4px;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e2d3a; padding: 24px 32px; text-align: center;">
              <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 300; color: #ffffff;">${title}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #f7f5f2; text-align: center;">
              <span style="font-family: 'Lato', Helvetica, sans-serif; font-size: 11px; color: #999;">
                Submitted via hobackclub.com &bull; ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// =============================================================================
// CONTACT FORM
// =============================================================================
exports.submitContact = onRequest(
  { secrets: [emailUser, emailPass], cors: false },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { firstName, lastName, email, phone, subject, message } = req.body;
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      const error = validateFields(req.body, ["firstName", "email", "subject", "message"]);
      if (error) return res.status(400).json({ error });
      if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email address" });

      // Store in Firestore
      await db.collection("submissions").add({
        type: "contact",
        firstName: sanitize(firstName),
        lastName: sanitize(lastName || ""),
        name: sanitize(fullName),
        email: sanitize(email),
        phone: sanitize(phone || ""),
        subject: sanitize(subject),
        message: sanitize(message),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send notification email
      await sendEmail(`Website Contact: ${sanitize(subject)}`, buildEmailHtml("New Contact Message", [
        ["Name", sanitize(fullName)],
        ["Email", `<a href="mailto:${sanitize(email)}">${sanitize(email)}</a>`],
        ["Phone", sanitize(phone || "N/A")],
        ["Subject", sanitize(subject)],
        ["Message", sanitize(message).replace(/\n/g, "<br>")],
      ]));

      res.status(200).json({ success: true, message: "Message sent successfully" });
    } catch (err) {
      console.error("Contact form error:", err);
      res.status(500).json({ error: "Failed to process submission" });
    }
  }
);

// =============================================================================
// STAY / RESERVATION INQUIRY FORM
// =============================================================================
exports.submitReservation = onRequest(
  { secrets: [emailUser, emailPass], cors: false },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { firstName, lastName, email, phone, checkIn, checkOut, guests, comments } = req.body;
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      const error = validateFields(req.body, ["firstName", "email", "checkIn", "checkOut"]);
      if (error) return res.status(400).json({ error });
      if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email address" });

      await db.collection("submissions").add({
        type: "reservation",
        firstName: sanitize(firstName),
        lastName: sanitize(lastName || ""),
        name: sanitize(fullName),
        email: sanitize(email),
        phone: sanitize(phone || ""),
        checkIn: sanitize(checkIn),
        checkOut: sanitize(checkOut),
        guests: sanitize(guests || ""),
        comments: sanitize(comments || ""),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendEmail(`Reservation Inquiry: ${sanitize(fullName)}`, buildEmailHtml("New Reservation Inquiry", [
        ["Name", sanitize(fullName)],
        ["Email", `<a href="mailto:${sanitize(email)}">${sanitize(email)}</a>`],
        ["Phone", sanitize(phone || "N/A")],
        ["Check-in", sanitize(checkIn)],
        ["Check-out", sanitize(checkOut)],
        ["Guests", sanitize(guests || "N/A")],
        ["Notes", sanitize(comments || "None").replace(/\n/g, "<br>")],
      ]));

      res.status(200).json({ success: true, message: "Reservation inquiry submitted" });
    } catch (err) {
      console.error("Reservation form error:", err);
      res.status(500).json({ error: "Failed to process submission" });
    }
  }
);

// =============================================================================
// MEMBERSHIP INQUIRY FORM
// =============================================================================
exports.submitMembership = onRequest(
  { secrets: [emailUser, emailPass], cors: false },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const { firstName, lastName, email, phone, city, state, referral, references, comments } = req.body;
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      const location = [city, state].filter(Boolean).join(", ");

      const error = validateFields(req.body, ["firstName", "email"]);
      if (error) return res.status(400).json({ error });
      if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email address" });

      await db.collection("submissions").add({
        type: "membership",
        firstName: sanitize(firstName),
        lastName: sanitize(lastName || ""),
        name: sanitize(fullName),
        email: sanitize(email),
        phone: sanitize(phone || ""),
        city: sanitize(city || ""),
        state: sanitize(state || ""),
        referral: sanitize(referral || ""),
        references: sanitize(references || ""),
        comments: sanitize(comments || ""),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendEmail(`Membership Inquiry: ${sanitize(fullName)}`, buildEmailHtml("New Membership Inquiry", [
        ["Name", sanitize(fullName)],
        ["Email", `<a href="mailto:${sanitize(email)}">${sanitize(email)}</a>`],
        ["Phone", sanitize(phone || "N/A")],
        ["Location", sanitize(location || "N/A")],
        ["How They Heard", sanitize(referral || "N/A")],
        ["References", sanitize(references || "None provided").replace(/\n/g, "<br>")],
        ["Additional Notes", sanitize(comments || "None").replace(/\n/g, "<br>")],
      ]));

      res.status(200).json({ success: true, message: "Membership inquiry submitted" });
    } catch (err) {
      console.error("Membership form error:", err);
      res.status(500).json({ error: "Failed to process submission" });
    }
  }
);
