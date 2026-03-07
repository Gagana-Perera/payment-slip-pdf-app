const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { renderForm, renderInvoice } = require("./views/templates");
const { renderAuthPage } = require("./views/authTemplates");
const app = express();
const PORT = process.env.PORT || 3000;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
}

// Seed a default admin user if no users exist
async function seedDefaultAdmin() {
  const users = loadUsers();
  if (users.length === 0) {
    const passwordHash = await bcrypt.hash("admin", 10);
    users.push({ id: "1", username: "admin", passwordHash });
    saveUsers(users);
    console.log("Default admin created: username=admin password=admin");
  }
}
seedDefaultAdmin();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "nexus-board-secret-key-super-secure",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, secure: false }
}));

// Auth Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect("/login");
}

// ─── Auth Routes ──────────────────────────────────────────────
app.get("/login", (req, res) => {
  if (req.session && req.session.userId) return res.redirect("/");
  res.send(renderAuthPage({ type: "login", errors: [] }));
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.send(renderAuthPage({ type: "login", errors: ["Username and password are required."], formData: { username } }));
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (match) {
      req.session.userId = user.id;
      req.session.username = user.username;
      return res.redirect("/");
    }
  }

  res.send(renderAuthPage({ type: "login", errors: ["Invalid username or password."], formData: { username } }));
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ─── Add User (Admin only, requires login) ─────────────────────
app.get("/add-user", requireAuth, (req, res) => {
  res.send(renderAuthPage({ type: "add-user", errors: [], success: [] }));
});

app.post("/add-user", requireAuth, async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  const errors = [];

  if (!username || !password || !confirmPassword) errors.push("All fields are required.");
  if (password !== confirmPassword) errors.push("Passwords do not match.");
  if (password && password.length < 5) errors.push("Password must be at least 5 characters.");

  if (errors.length > 0) {
    return res.send(renderAuthPage({ type: "add-user", errors, success: [], formData: { username } }));
  }

  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.send(renderAuthPage({ type: "add-user", errors: ["Username already exists."], success: [], formData: { username } }));
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ id: Date.now().toString(), username, passwordHash });
  saveUsers(users);

  res.send(renderAuthPage({ type: "add-user", errors: [], success: [`User "${username}" created successfully!`], formData: {} }));
});

// ─── Utility Functions ────────────────────────────────────────
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
  return String(value).trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50);
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
  return filenames.map(name => path.join(__dirname, "public", "images", name)).find(p => fs.existsSync(p)) || null;
}

function getHeaderImages() {
  const bannerImagePath = findFirstExistingImage([
    "header-bg.png", "header-bg.jpg", "header-bg.jpeg",
    "header-background.png", "header-background.jpg", "header-background.jpeg",
    "header-banner-1.png", "header-banner-1.jpg", "header-banner-1.jpeg",
    "header-banner.png", "header-banner.jpg", "header-banner.jpeg",
  ]);
  const logoImagePath = findFirstExistingImage([
    "header-logo.png", "header-logo.jpg", "header-logo.jpeg",
    "header-banner-2.png", "header-banner-2.jpg", "header-banner-2.jpeg",
  ]);
  return { bannerImagePath, logoImagePath };
}

function imagePathToDataUri(imagePath) {
  if (!imagePath) return null;
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : (ext === ".jpg" || ext === ".jpeg") ? "image/jpeg" : "application/octet-stream";
  const base64 = fs.readFileSync(imagePath).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

// ─── Main App Routes ──────────────────────────────────────────
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

  const submittedMonths = Array.isArray(req.body.months) ? req.body.months : req.body.months ? [req.body.months] : [];
  const selectedMonths = MONTHS.filter(month => submittedMonths.includes(month));

  if (!name) errors.push("Name cannot be empty.");
  if (!date) errors.push("Date is required.");
  if (date && Number.isNaN(new Date(date).getTime())) errors.push("Date is invalid.");
  if (!Number.isFinite(amount) || amount <= 0) errors.push("Amount must be a number greater than 0.");
  if (invoiceType === "Monthly Subscription" && selectedMonths.length === 0) {
    errors.push("At least one month must be selected for Monthly Subscriptions.");
  }

  if (errors.length > 0) {
    return res.status(400).send(renderForm({
      errors,
      formData: { name, date, amount: amountInput, invoiceType, months: selectedMonths },
      months: MONTHS,
      user: req.session.username,
    }));
  }

  try {
    const styleContent = fs.readFileSync(path.join(__dirname, "public", "style.css"), "utf8");
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
      margin: { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
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
