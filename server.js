require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const session = require("express-session");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { renderForm, renderInvoice } = require("./views/templates");
const { renderAuthPage } = require("./views/authTemplates");
const app = express();
const PORT = process.env.PORT || 3000;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const USERS_FILE_PATH = path.join(__dirname, "data", "users.json");

if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}
if (!fs.existsSync(USERS_FILE_PATH)) {
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify([]));
}

function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: 'nexus-board-secret-key-super-secure',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 Day
    secure: false // Set to true if using HTTPS
  }
}));

// Setup Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Standardizing on Gmail for ease of app password
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Authentication Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

app.get("/login", (req, res) => {
  if (req.session && req.session.userId) return res.redirect("/");
  res.send(renderAuthPage({ type: 'login', errors: [] }));
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const errors = [];
  
  if (!username || !password) {
    errors.push("Username and Password are required.");
    return res.send(renderAuthPage({ type: 'login', errors, formData: { username } }));
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (user) {
    if (!user.approved) {
      errors.push("Account strictly pending internal administrator approval.");
      return res.send(renderAuthPage({ type: 'login', errors, formData: { username } }));
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (match) {
      req.session.userId = user.id;
      req.session.username = user.username;
      
      // Clean up unverified attempts array in prod, but redirect for now
      return res.redirect("/");
    }
  }

  errors.push("Invalid credentials or unauthorized access.");
  res.send(renderAuthPage({ type: 'login', errors, formData: { username } }));
});

app.get("/register", (req, res) => {
  if (req.session && req.session.userId) return res.redirect("/");
  res.send(renderAuthPage({ type: 'register', errors: [] }));
});

app.post("/register", async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  const errors = [];

  if (!username || !password || !confirmPassword) errors.push("All fields are required.");
  if (password !== confirmPassword) errors.push("Passwords do not match.");
  if (password.length < 5) errors.push("Access Key must be at least 5 characters.");

  if (errors.length > 0) {
    return res.send(renderAuthPage({ type: 'register', errors, formData: { username } }));
  }

  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    errors.push("System ID already allocated.");
    return res.send(renderAuthPage({ type: 'register', errors, formData: { username } }));
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = Date.now().toString();
    users.push({
      id: newUserId,
      username,
      passwordHash,
      approved: false // Must be approved by admin
    });
    saveUsers(users);

    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const approvalLink = `http://${req.headers.host}/approve/${newUserId}`;
    
    // Non-blocking mail dispatch
    if (adminEmail && process.env.SMTP_PASS) {
      transporter.sendMail({
        from: `"Nexus System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `New Board Member Registered: ${username}`,
        html: `
          <h3>Security Alert: New Registration</h3>
          <p>A new user has requested access to the Nexus Payment terminal.</p>
          <p><strong>System ID (Username):</strong> ${username}</p>
          <hr/>
          <p>To grant secure access to this user, click the authorization link below:</p>
          <a href="${approvalLink}" style="display:inline-block;padding:10px 20px;background:#1a427a;color:#fff;text-decoration:none;border-radius:5px;">Approve User</a>
          <br/><br/>
          <p><small>If you do not recognize this request, ignore this email.</small></p>
        `
      }).catch(e => console.error("Email failed:", e));
    }

    // Pass highly specific success flag or redirect back to login
    res.send(renderAuthPage({ type: 'login', errors: ["Account successfully generated. Please wait for internal administrator approval to log in."], formData: { username } }));
  } catch (err) {
    errors.push("Internal system fault during registration.");
    res.send(renderAuthPage({ type: 'register', errors, formData: { username } }));
  }
});

app.get("/approve/:id", (req, res) => {
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).send("<h1>User Not Found</h1><p>The link might be invalid or expired.</p>");
  }

  if (users[userIndex].approved) {
    return res.send("<h1>Already Approved</h1><p>This user has already been granted access.</p>");
  }

  // Grant access
  users[userIndex].approved = true;
  saveUsers(users);

  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h1 style="color: #4CAF50;">Authentication Authorized</h1>
      <p>The user <strong>${users[userIndex].username}</strong> is now cleared to access the Nexus Payment terminal.</p>
    </div>
  `);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

function toDisplayDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function sanitizeFilePart(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 50);
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const serial = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `INV-${y}${m}${d}-${serial}`;
}

function findFirstExistingImage(filenames) {
  const existing = filenames
    .map((name) => path.join(__dirname, "public", "images", name))
    .find((imgPath) => fs.existsSync(imgPath));

  return existing || null;
}

function getHeaderImages() {
  const bannerImagePath = findFirstExistingImage([
    "header-bg.png",
    "header-bg.jpg",
    "header-bg.jpeg",
    "header-background.png",
    "header-background.jpg",
    "header-background.jpeg",
    "header-banner-1.png",
    "header-banner-1.jpg",
    "header-banner-1.jpeg",
    "header-banner.png",
    "header-banner.jpg",
    "header-banner.jpeg",
  ]);

  const logoImagePath = findFirstExistingImage([
    "header-logo.png",
    "header-logo.jpg",
    "header-logo.jpeg",
    "header-banner-2.png",
    "header-banner-2.jpg",
    "header-banner-2.jpeg",
  ]);

  return { bannerImagePath, logoImagePath };
}

function imagePathToDataUri(imagePath) {
  if (!imagePath) return null;

  const extension = path.extname(imagePath).toLowerCase();
  const mimeType =
    extension === ".png"
      ? "image/png"
      : extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

  const base64 = fs.readFileSync(imagePath).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

app.get("/", requireAuth, (req, res) => {
  res.send(renderForm({
    errors: [],
    formData: { name: "", date: "", amount: "", invoiceType: "Monthly Subscription", months: [] },
    months: MONTHS,
    user: req.session.username
  }));
});

app.post("/generate", requireAuth, async (req, res) => {
  const errors = [];

  const name = (req.body.name || "").trim();
  const date = req.body.date || "";
  const amountInput = req.body.amount;
  const amount = Number.parseFloat(amountInput);
  const invoiceType = req.body.invoiceType || "Monthly Subscription";

  const submittedMonths = Array.isArray(req.body.months)
    ? req.body.months
    : req.body.months
      ? [req.body.months]
      : [];

  const selectedMonths = MONTHS.filter((month) =>
    submittedMonths.includes(month),
  );

  if (!name) errors.push("Name cannot be empty.");
  if (!date) errors.push("Date is required.");
  if (date && Number.isNaN(new Date(date).getTime()))
    errors.push("Date is invalid.");
  if (!Number.isFinite(amount) || amount <= 0)
    errors.push("Amount must be a number greater than 0.");
    
  if (invoiceType === "Monthly Subscription" && selectedMonths.length === 0) {
    errors.push("At least one month must be selected for Monthly Subscriptions.");
  }

  if (errors.length > 0) {
    return res.status(400).send(renderForm({
      errors,
      formData: {
        name,
        date,
        amount: amountInput,
        invoiceType,
        months: selectedMonths,
      },
      months: MONTHS,
    }));
  }

  try {
    const styleContent = fs.readFileSync(
      path.join(__dirname, "public", "style.css"),
      "utf8",
    );
    const selectedMonthsText = selectedMonths.join(", ");
    const headerImages = getHeaderImages();

    const html = renderInvoice({
      invoiceNumber: generateInvoiceNumber(),
      customerName: name,
      paymentDate: toDisplayDate(date),
      invoiceType,
      selectedMonthsText,
      amountText: amount.toFixed(2),
      styleContent,
      bannerImageSrc: imagePathToDataUri(headerImages.bannerImagePath),
      logoImageSrc: imagePathToDataUri(headerImages.logoImagePath),
    });

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "12mm",
        bottom: "15mm",
        left: "12mm",
      },
    });

    await browser.close();

    const safeName = sanitizeFilePart(name) || "Customer";
    const filename = `PaymentSlip_${safeName}_${date}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).send("Failed to generate PDF. Please try again.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
