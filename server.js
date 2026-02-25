const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require("puppeteer");

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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function toDisplayDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
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

  return existing ? `file://${existing}` : null;
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

app.get("/", (req, res) => {
  res.render("form", {
    errors: [],
    formData: { name: "", date: "", amount: "", months: [] },
    months: MONTHS,
  });
});

app.post("/generate", async (req, res) => {
  const errors = [];

  const name = (req.body.name || "").trim();
  const date = req.body.date || "";
  const amountInput = req.body.amount;
  const amount = Number.parseFloat(amountInput);

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
  if (selectedMonths.length === 0)
    errors.push("At least one month must be selected.");

  if (errors.length > 0) {
    return res.status(400).render("form", {
      errors,
      formData: {
        name,
        date,
        amount: amountInput,
        months: selectedMonths,
      },
      months: MONTHS,
    });
  }

  try {
    const stylePath = `file://${path.join(__dirname, "public", "style.css")}`;
    const selectedMonthsText = selectedMonths.join(", ");
    const headerImages = getHeaderImages();

    const html = await ejs.renderFile(
      path.join(__dirname, "views", "invoice.ejs"),
      {
        invoiceNumber: generateInvoiceNumber(),
        customerName: name,
        paymentDate: toDisplayDate(date),
        selectedMonthsText,
        amountText: amount.toFixed(2),
        stylePath,
        bannerImagePath: headerImages.bannerImagePath,
        logoImagePath: headerImages.logoImagePath,
      },
    );

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
