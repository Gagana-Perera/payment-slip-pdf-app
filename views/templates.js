function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderForm({ errors = [], formData = {}, months = [] }) {
  const { name = "", date = "", amount = "", months: selectedMonths = [] } = formData;
  
  const errorHtml = errors.length > 0 ? `
      <div class="alert" role="alert">
        <strong>Please fix the following:</strong>
        <ul>
          ${errors.map(err => `<li>${escapeHtml(err)}</li>`).join("\\n          ")}
        </ul>
      </div>` : '';

  const monthsHtml = months.map(month => `
            <label class="checkbox-item">
              <input
                type="checkbox"
                name="months"
                value="${escapeHtml(month)}"
                ${selectedMonths.includes(month) ? 'checked' : ''}
              />
              <span>${escapeHtml(month)}</span>
            </label>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Slip Generator</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body class="app-bg">
  <main class="card">
    <h1>Payment Slip Generator</h1>
    <p class="subtitle">Fill in the details to generate a professional PDF invoice.</p>
${errorHtml}
    <form action="/generate" method="POST" class="form-grid">
      <div class="field">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" value="${escapeHtml(name)}" required />
      </div>

      <div class="field">
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="${escapeHtml(date)}" required />
      </div>

      <div class="field">
        <label for="amount">Amount (LKR)</label>
        <input type="number" id="amount" name="amount" min="0.01" step="0.01" value="${escapeHtml(amount)}" required />
      </div>

      <fieldset class="field months-field">
        <legend>Months</legend>
        <div class="months-grid">
${monthsHtml}
        </div>
      </fieldset>

      <button type="submit" class="btn">Generate & Download PDF</button>
    </form>
  </main>
</body>
</html>`;
}

function renderInvoice({
  invoiceNumber,
  customerName,
  paymentDate,
  selectedMonthsText,
  amountText,
  styleContent,
  bannerImageSrc,
  logoImageSrc
}) {
  const bannerImageHtml = bannerImageSrc ? `<img src="${bannerImageSrc}" alt="Header Banner" class="banner-image" />` : '';
  const logoImageHtml = logoImageSrc ? `<img src="${logoImageSrc}" alt="Header Logo" class="logo-image" />` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice</title>
  <style>
    ${styleContent}
  </style>
</head>
<body class="invoice-page">
  <div class="invoice-sheet">
    <!-- Header Banner -->
    <div class="banner-container">
      ${bannerImageHtml}
      ${logoImageHtml}
    </div>

    <!-- Title and Date -->
    <div class="title-section">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-date">Invoice No: <strong>${escapeHtml(invoiceNumber)}</strong></div>
      <div class="invoice-date">Date: <strong>${escapeHtml(paymentDate)}</strong></div>
    </div>

    <!-- Info Columns -->
    <div class="info-columns">
      <div class="col-left">
        <div class="info-heading">Bill To</div>
        <div class="info-value">${escapeHtml(customerName)}</div>
      </div>
      <div class="col-right">
        <div class="info-heading">For</div>
        <div class="info-value">Monthly subscription</div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-desc">Item Description</th>
          <th class="col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="desc bordered-cell">Monthly Subscription (${escapeHtml(selectedMonthsText)})</td>
          <td class="amt bordered-cell"><div class="amt-content"><span>LKR</span> <span>${escapeHtml(amountText)}</span></div></td>
        </tr>
        <tr class="empty-row">
          <td class="bordered-cell"></td>
          <td class="bordered-cell"></td>
        </tr>
        <tr>
          <td class="total-label">Subtotal</td>
          <td class="amt bordered-cell"><div class="amt-content"><span>LKR</span> <span>${escapeHtml(amountText)}</span></div></td>
        </tr>
        <tr>
          <td class="total-label">Tax Rate</td>
          <td class="amt bordered-cell"></td>
        </tr>
        <tr>
          <td class="total-label">Other Costs</td>
          <td class="amt bordered-cell"></td>
        </tr>
        <tr class="total-cost-row">
          <td class="total-label-dark">Total Cost</td>
          <td class="amt-dark bordered-cell"><div class="amt-content"><span>LKR</span> <span>${escapeHtml(amountText)}</span></div></td>
        </tr>
      </tbody>
    </table>

    <!-- Footer Notes -->
    <div class="footer-notes">
      <p>If you have any questions concerning this invoice, use the following contact information:</p>
      <p class="contact-info"><a href="mailto:dulshanperera011@gmail.com">Rasantha Dulshan (Treasurer), +94 75 2515524, dulshanperera011@gmail.com</a></p>
      <p>Thank you for your Contribution!</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  renderForm,
  renderInvoice
};
