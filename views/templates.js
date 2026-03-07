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
  const { name = "", date = "", amount = "", invoiceType = "Monthly Subscription", months: selectedMonths = [] } = formData;
  
  const errorHtml = errors.length > 0 ? `
      <div class="alert" role="alert">
        <strong>Please fix the following issues:</strong>
        <ul>
          ${errors.map(err => `<li>${escapeHtml(err)}</li>`).join("\\n          ")}
        </ul>
      </div>` : '';

  const monthsHtml = months.map(month => `
            <label class="checkbox-item ${selectedMonths.includes(month) ? 'checked' : ''}">
              <input
                type="checkbox"
                name="months"
                value="${escapeHtml(month)}"
                class="sr-only"
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css" />
</head>
<body class="app-bg">
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>

  <div class="dashboard-container">
    <div class="card layout-grid">
      
      <!-- Left Column: Form -->
      <section class="form-section">
        <div class="form-header">
          <div class="badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Professional Invoice Generator
          </div>
          <h1>Payment Slip Generator</h1>
          <p class="subtitle">Fill in the details below to instantly generate a high-quality PDF invoice for your records.</p>
        </div>

        ${errorHtml}

        <form action="/generate" method="POST" class="form-content" id="paymentForm">
          <div class="field">
            <label for="invoiceType">Invoice Type</label>
            <div class="select-wrapper">
              <select id="invoiceType" name="invoiceType" required>
                <option value="Monthly Subscription" ${invoiceType === 'Monthly Subscription' ? 'selected' : ''}>Monthly Subscription</option>
                <option value="T-Shirt Payment" ${invoiceType === 'T-Shirt Payment' ? 'selected' : ''}>T-Shirt Payment</option>
              </select>
            </div>
            <p class="helper-text">Select the category for this payment.</p>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="name">Customer Name</label>
              <input type="text" id="name" name="name" placeholder="E.g. Jane Doe" value="${escapeHtml(name)}" required />
            </div>

            <div class="field">
              <label for="date">Invoice Date</label>
              <input type="date" id="date" name="date" value="${escapeHtml(date)}" required />
            </div>
          </div>

          <div class="field">
            <label for="amount">Total Amount</label>
            <div class="input-with-prefix">
              <span class="prefix">LKR</span>
              <input type="number" id="amount" name="amount" min="0.01" step="0.01" placeholder="0.00" value="${escapeHtml(amount)}" required />
            </div>
          </div>

          <fieldset class="field months-field fade-in" id="monthsFieldset" style="${invoiceType === 'T-Shirt Payment' ? 'display: none;' : ''}">
            <legend>Applicable Months</legend>
            <div class="months-grid">
              ${monthsHtml}
            </div>
          </fieldset>

          <button type="submit" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Generate & Download PDF
          </button>
        </form>
      </section>

      <!-- Right Column: Live Summary / Preview-->
      <aside class="summary-section">
        <div class="summary-card">
          <div class="summary-header">
            <h3>Invoice Summary</h3>
            <span class="status-badge">Live Preview</span>
          </div>

          <div class="summary-content">
            <div class="summary-item">
              <span class="label">Invoice Type</span>
              <span class="value" id="preview-type">${escapeHtml(invoiceType)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Billed To</span>
              <span class="value" id="preview-name">${name ? escapeHtml(name) : '<span class="empty-placeholder">Not specified</span>'}</span>
            </div>
            <div class="summary-item">
              <span class="label">Date</span>
              <span class="value" id="preview-date">${date ? escapeHtml(date) : '<span class="empty-placeholder">Not specified</span>'}</span>
            </div>
            <div class="summary-item" id="preview-months-container" style="${invoiceType === 'T-Shirt Payment' ? 'display: none;' : ''}">
              <span class="label">Months Covered</span>
              <div class="value tags-container" id="preview-months">
                ${selectedMonths.length > 0 ? selectedMonths.map(m => `<span class="tag">${escapeHtml(m)}</span>`).join('') : '<span class="empty-placeholder">None selected</span>'}
              </div>
            </div>
            
            <hr class="summary-divider" />
            
            <div class="summary-item total-row">
              <span class="label">Total Amount</span>
              <span class="value amount-huge">LKR <span id="preview-amount">${amount ? escapeHtml(amount) : '0.00'}</span></span>
            </div>
          </div>
          
          <div class="summary-footer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Secure PDF Generation
          </div>
        </div>
      </aside>

    </div>
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const invoiceTypeSelect = document.getElementById("invoiceType");
      const monthsFieldset = document.getElementById("monthsFieldset");
      
      const nameInput = document.getElementById("name");
      const dateInput = document.getElementById("date");
      const amountInput = document.getElementById("amount");
      const monthCheckboxes = document.querySelectorAll('input[name="months"]');
      
      const previewType = document.getElementById("preview-type");
      const previewName = document.getElementById("preview-name");
      const previewDate = document.getElementById("preview-date");
      const previewAmount = document.getElementById("preview-amount");
      const previewMonths = document.getElementById("preview-months");
      const previewMonthsContainer = document.getElementById("preview-months-container");

      function toggleMonthsVisibility() {
        if (invoiceTypeSelect.value === "T-Shirt Payment") {
          monthsFieldset.style.display = "none";
          previewMonthsContainer.style.display = "none";
        } else {
          monthsFieldset.style.display = "block";
          previewMonthsContainer.style.display = "flex";
        }
        previewType.textContent = invoiceTypeSelect.value;
      }

      function updatePreviewName() {
        const val = nameInput.value.trim();
        if (val) {
          previewName.textContent = val;
        } else {
          previewName.innerHTML = '<span class="empty-placeholder">Not specified</span>';
        }
      }

      function updatePreviewDate() {
        const val = dateInput.value;
        if (val) {
          previewDate.textContent = val;
        } else {
          previewDate.innerHTML = '<span class="empty-placeholder">Not specified</span>';
        }
      }

      function updatePreviewAmount() {
        const val = amountInput.value;
        if (val) {
          previewAmount.textContent = Number(val).toFixed(2);
        } else {
          previewAmount.textContent = '0.00';
        }
      }

      function toggleMonthStyles(checkbox) {
         const label = checkbox.closest('.checkbox-item');
         if(checkbox.checked) {
            label.classList.add('checked');
         } else {
            label.classList.remove('checked');
         }
      }

      function updatePreviewMonths() {
        const selected = Array.from(monthCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (selected.length > 0) {
          previewMonths.innerHTML = selected.map(m => \`<span class="tag">\${m}</span>\`).join('');
        } else {
          previewMonths.innerHTML = '<span class="empty-placeholder">None selected</span>';
        }
      }

      invoiceTypeSelect.addEventListener("change", toggleMonthsVisibility);
      nameInput.addEventListener("input", updatePreviewName);
      dateInput.addEventListener("input", updatePreviewDate);
      amountInput.addEventListener("input", updatePreviewAmount);
      
      monthCheckboxes.forEach(cb => {
        cb.addEventListener("change", (e) => {
          updatePreviewMonths();
          toggleMonthStyles(e.target);
        });
      });
      
      // Initialize layout correctness upon load (in case of cached inputs)
      updatePreviewName();
      updatePreviewDate();
      updatePreviewAmount();
      updatePreviewMonths();
    });
  </script>
</body>
</html>`;
}

function renderInvoice({
  invoiceNumber,
  customerName,
  paymentDate,
  invoiceType,
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
        <div class="info-value">${escapeHtml(invoiceType)}</div>
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
          <td class="desc bordered-cell">${escapeHtml(invoiceType)}${selectedMonthsText ? ` (${escapeHtml(selectedMonthsText)})` : ''}</td>
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
