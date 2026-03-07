function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderForm({ errors = [], formData = {}, months = [], user = 'Board Member' }) {
  const { name = "", date = "", amount = "", invoiceType = "Monthly Subscription", months: selectedMonths = [] } = formData;
  
  const errorHtml = errors.length > 0 ? `
      <div class="alert fade-in" role="alert">
        <strong><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Authentication / Input Error</strong>
        <ul>
          ${errors.map(err => `<li>${escapeHtml(err)}</li>`).join("\\n          ")}
        </ul>
      </div>` : '';

  const monthsHtml = months.map(month => `
            <label class="chip ${selectedMonths.includes(month) ? 'checked' : ''}">
              <input
                type="checkbox"
                name="months"
                value="${escapeHtml(month)}"
                class="sr-only"
                ${selectedMonths.includes(month) ? 'checked' : ''}
              />
              <span class="chip-text">${escapeHtml(month)}</span>
            </label>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Slip Generator | Nexus System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css" />
</head>
<body class="theme-dark">
  <!-- Cinematic Background Elements -->
  <div class="bg-orb orb-primary"></div>
  <div class="bg-orb orb-secondary"></div>
  <div class="bg-orb orb-accent"></div>
  <div class="bg-noise"></div>
  <div class="bg-grid"></div>

  <div class="global-container">
    
    <!-- Glassmorphic Dashboard Shell -->
    <div class="shell fade-up">
      <div class="shell-highlight-top"></div>
      
      <div class="dashboard-grid">
        
        <!-- Left Column: Command Form -->
        <main class="control-panel staggered-1">
          <header class="panel-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 class="header-title">
                Payment Data <br /> Configuration
              </h1>
              <p class="header-subtitle">Secure terminal. Authorized as: <span style="color: #a5b4fc;">${escapeHtml(user)}</span></p>
            </div>
            <a href="/logout" class="btn-generate" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; background: rgba(220, 38, 38, 0.15); border-color: rgba(220, 38, 38, 0.4); text-decoration: none;">
              <span class="btn-content" style="color: #fca5a5;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Secure Sign Out
              </span>
            </a>
          </header>

          ${errorHtml}

          <form action="/generate" method="POST" class="form-grid" id="paymentForm">
            
            <div class="input-group">
              <label for="invoiceType">Transaction Classification</label>
              <div class="select-glow-wrapper">
                <select id="invoiceType" name="invoiceType" class="glass-input" required>
                  <option value="Monthly Subscription" ${invoiceType === 'Monthly Subscription' ? 'selected' : ''}>Monthly Subscription</option>
                  <option value="T-Shirt Payment" ${invoiceType === 'T-Shirt Payment' ? 'selected' : ''}>T-Shirt Payment</option>
                </select>
              </div>
            </div>

            <div class="input-row">
              <div class="input-group">
                <label for="name">Entity / Customer Name</label>
                <div class="input-glow-wrapper">
                  <input type="text" id="name" name="name" class="glass-input" placeholder="e.g. John Doe" value="${escapeHtml(name)}" required autocomplete="off" />
                </div>
              </div>

              <div class="input-group">
                <label for="date">Ledger Date</label>
                <div class="input-glow-wrapper">
                  <input type="date" id="date" name="date" class="glass-input" value="${escapeHtml(date)}" required />
                </div>
              </div>
            </div>

            <div class="input-group">
              <label for="amount">Settlement Amount</label>
              <div class="input-glow-wrapper with-prefix">
                <span class="currency-prefix">LKR</span>
                <input type="number" id="amount" name="amount" class="glass-input amount-input" min="0.01" step="0.01" placeholder="0.00" value="${escapeHtml(amount)}" required />
              </div>
            </div>

            <fieldset class="input-group months-group fade-in" id="monthsFieldset" style="${invoiceType === 'T-Shirt Payment' ? 'display: none;' : ''}">
              <legend>Billing Cycles</legend>
              <div class="chip-grid">
                ${monthsHtml}
              </div>
            </fieldset>

            <div class="action-bar">
              <button type="submit" class="btn-generate">
                <span class="btn-glow-effect"></span>
                <span class="btn-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF
                </span>
              </button>
            </div>
          </form>
        </main>

        <!-- Right Column: Cinematic Live Hologram/Preview -->
        <aside class="preview-panel staggered-2">
          
          <div class="hologram-card">
            <div class="hologram-border"></div>
            <div class="hologram-glass">
              
              <div class="holo-header">
                <div class="brand">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="brand-icon"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  <span class="brand-text">NEXUS INVOICE</span>
                </div>
                <div class="status-live">
                  <span class="status-dot-pulse"></span>
                  LIVE SYNC
                </div>
              </div>

              <div class="holo-body">
                <div class="data-block">
                  <div class="data-label">TRANSACTION TYPE</div>
                  <div class="data-value highlight" id="preview-type">${escapeHtml(invoiceType)}</div>
                </div>

                <div class="data-block">
                  <div class="data-label">ISSUED TO</div>
                  <div class="data-value" id="preview-name">${name ? escapeHtml(name) : '<span class="empty-data">Awaiting Input...</span>'}</div>
                </div>

                <div class="data-row">
                  <div class="data-block">
                    <div class="data-label">TIMESTAMP</div>
                    <div class="data-value" id="preview-date">${date ? escapeHtml(date) : '<span class="empty-data">-- / -- / ----</span>'}</div>
                  </div>
                </div>

                <div class="data-block" id="preview-months-container" style="${invoiceType === 'T-Shirt Payment' ? 'display: none;' : ''}">
                  <div class="data-label">CYCLES COVERED</div>
                  <div class="data-tags" id="preview-months">
                    ${selectedMonths.length > 0 ? selectedMonths.map(m => `<span class="holo-tag">${escapeHtml(m)}</span>`).join('') : '<span class="empty-data">None detected</span>'}
                  </div>
                </div>
                
                <div class="divider-line"></div>
                
                <div class="data-block total-block">
                  <div class="data-label">AMOUNT DUE</div>
                  <div class="data-value amount-display">
                    <span class="currency-tag">LKR</span> 
                    <span id="preview-amount">${amount ? escapeHtml(amount) : '0.00'}</span>
                  </div>
                </div>
              </div>
              
              <div class="holo-footer">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secure 256-bit AES Encryption
              </div>
            </div>
          </div>

        </aside>

      </div>
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

      // Smooth type tracking
      function toggleMonthsVisibility() {
        // trigger subtle reflow animation
        monthsFieldset.style.opacity = '0';
        previewMonthsContainer.style.opacity = '0';
        
        setTimeout(() => {
          if (invoiceTypeSelect.value === "T-Shirt Payment") {
            monthsFieldset.style.display = "none";
            previewMonthsContainer.style.display = "none";
          } else {
            monthsFieldset.style.display = "block";
            previewMonthsContainer.style.display = "flex";
            
            // Fade block back in
            setTimeout(() => {
              monthsFieldset.style.opacity = '1';
              previewMonthsContainer.style.opacity = '1';
            }, 50);
          }
          previewType.textContent = invoiceTypeSelect.value;
        }, 200);
      }

      function updatePreviewName() {
        const val = nameInput.value.trim();
        if (val) {
          previewName.textContent = val;
        } else {
          previewName.innerHTML = '<span class="empty-data">Awaiting Input...</span>';
        }
      }

      function updatePreviewDate() {
        const val = dateInput.value;
        if (val) {
          previewDate.textContent = val;
        } else {
          previewDate.innerHTML = '<span class="empty-data">-- / -- / ----</span>';
        }
      }

      function updatePreviewAmount() {
        const val = amountInput.value;
        if (val) {
          const formatted = Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          previewAmount.textContent = formatted;
        } else {
          previewAmount.textContent = '0.00';
        }
      }

      function toggleMonthStyles(checkbox) {
         const label = checkbox.closest('.chip');
         if(checkbox.checked) {
            label.classList.add('checked');
         } else {
            label.classList.remove('checked');
         }
      }

      function updatePreviewMonths() {
        const selected = Array.from(monthCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (selected.length > 0) {
          previewMonths.innerHTML = selected.map(m => \`<span class="holo-tag">\${m}</span>\`).join('');
        } else {
          previewMonths.innerHTML = '<span class="empty-data">None detected</span>';
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
      
      // Initialize view
      updatePreviewName();
      updatePreviewDate();
      updatePreviewAmount();
      updatePreviewMonths();
    });
  </script>
</body>
</html>`;
}

// renderInvoice is responsible for generating the HTML for the PDF invoice
const renderInvoice = ({
  invoiceNumber,
  customerName: name,
  paymentDate: date,
  invoiceType,
  selectedMonthsText,
  amountText: amount,
  styleContent,
  bannerImageSrc: bannerImage,
  logoImageSrc: logoImage
}) => {
  // Format amount with commas
  const amountNum = parseFloat(amount);
  const formattedAmount = !isNaN(amountNum) ? amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : amount;

  // Use a simpler date format directly without invoice number
  const formattedDate = date ? date : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice</title>
  <style>
    /* Exact PDF Styling matching user layout provided */
    body.invoice-page {
      background: #fff;
      color: #000;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    .invoice-sheet {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      box-sizing: border-box;
    }
    .banner-container {
      position: relative;
      margin-bottom: 1.5rem;
      width: 100%;
    }
    .banner-image {
      width: 100%;
      height: auto;
      display: block;
    }
    .logo-image {
      position: absolute;
      right: 30px;
      top: 50%;
      transform: translateY(-50%);
      max-height: 90px;
      object-fit: contain;
    }
    .title-section {
      margin-bottom: 1.5rem;
    }
    .invoice-title {
      font-family: Georgia, "Times New Roman", Times, serif;
      font-size: 2.25rem;
      color: #1a427a;
      margin-bottom: 0.2rem;
      font-weight: normal;
    }
    .invoice-date {
      font-size: 0.95rem;
      line-height: 1.4;
      color: #000;
    }
    .info-columns {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .col-left, .col-right {
      width: 48%;
    }
    .info-heading {
      font-family: Georgia, "Times New Roman", Times, serif;
      font-size: 1.75rem;
      color: #1a427a;
      margin-bottom: 0.2rem;
      font-weight: normal;
    }
    .info-value {
      font-size: 0.95rem;
      color: #000;
      font-weight: normal;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .items-table th {
      background-color: #0f3964; /* Very deep blue */
      color: #fff;
      text-align: center;
      padding: 8px 10px;
      font-weight: bold;
      border: 1px solid #0f3964;
    }
    .items-table th.col-amt {
      border-left: 1px solid #fff; /* White separator line */
    }
    .col-desc { width: 66%; text-align: center !important; }
    .col-amt { width: 34%; text-align: center !important; }
    
    .items-table td {
      vertical-align: top;
    }
    .items-table td.desc {
      color: #000;
      border-left: 1px solid #0f3964;
      border-right: 1px solid #0f3964;
      padding: 8px 10px;
    }
    .items-table td.amt {
      color: #000;
      border-right: 1px solid #0f3964;
      padding: 8px 10px;
    }
    .empty-row td.desc {
      padding: 15px 10px;
      background-color: #f0f4f8; /* Light blueish grey */
      border-bottom: 2px solid #0f3964;
      border-left: 1px solid #0f3964;
      border-right: 1px solid #0f3964;
    }
    .empty-row td.amt {
      padding: 15px 10px;
      background-color: #f0f4f8;
      border-bottom: 2px solid #0f3964;
      border-right: 1px solid #0f3964;
    }
    
    .total-row td {
      padding: 8px 10px;
    }
    .total-label {
      text-align: right;
      color: #2b4566;
      font-size: 0.9rem;
      border: none;
      padding-right: 15px;
    }
    .amt-box {
      border-bottom: 1px solid #0f3964;
      border-left: 1px solid #0f3964;
      border-right: 1px solid #0f3964;
      padding: 8px 10px;
    }
    .total-cost-row td {
      padding: 8px 10px;
      vertical-align: middle;
    }
    .total-label-huge {
      text-align: right;
      color: #2b4566;
      font-size: 1.45rem;
      border: none;
      padding-right: 15px;
    }
    .amt-dark {
      background-color: #2b5080;
      color: #fff !important;
      border: 1px solid #2b5080;
      padding: 8px 10px;
    }
    .amt-content {
      display: flex;
      justify-content: space-between;
    }
    
    .footer-notes {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #000;
      line-height: 1.4;
    }
    .contact-info {
      margin: 0.2rem 0;
    }
    .contact-info a {
      color: #229fd9;
      text-decoration: underline;
    }
    ${styleContent}
  </style>
</head>
<body class="invoice-page">
  <div class="invoice-sheet">
    <div class="banner-container">
      ${bannerImage ? `<img src="${bannerImage}" alt="Banner" class="banner-image" />` : ''}
      ${logoImage ? `<img src="${logoImage}" alt="Logo" class="logo-image" />` : ''}
    </div>

    <header class="title-section">
      <h1 class="invoice-title">Invoice</h1>
      <div class="invoice-date">
        Date: ${escapeHtml(formattedDate)}
      </div>
    </header>

    <div class="info-columns">
      <div class="col-left">
        <h2 class="info-heading">Bill To</h2>
        <div class="info-value">${escapeHtml(name)}</div>
      </div>
      <div class="col-right">
        <h2 class="info-heading">For</h2>
        <div class="info-value">${escapeHtml(invoiceType)}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="col-desc">Item Description</th>
          <th class="col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="desc" style="text-align: left;">
            ${escapeHtml(invoiceType === 'Monthly Subscription' ? 'Monthly Subscription' : 'T-Shirt Payment')}
            ${selectedMonthsText ? ` (${escapeHtml(selectedMonthsText)})` : ''}
          </td>
          <td class="amt"><div class="amt-content"><span>LKR</span> <span>${escapeHtml(formattedAmount)}</span></div></td>
        </tr>
        <tr class="empty-row">
          <td class="desc"></td>
          <td class="amt"></td>
        </tr>
        <tr class="total-row">
          <td class="total-label">Subtotal</td>
          <td class="amt-box"><div class="amt-content"><span>LKR</span> <span>${escapeHtml(formattedAmount)}</span></div></td>
        </tr>
        <tr class="total-row">
          <td class="total-label">Tax Rate</td>
          <td class="amt-box"></td>
        </tr>
        <tr class="total-row">
          <td class="total-label">Other Costs</td>
          <td class="amt-box"></td>
        </tr>
        <tr class="total-cost-row">
          <td class="total-label-huge">Total Cost</td>
          <td class="amt-dark"><div class="amt-content"><span>LKR</span> <span>${escapeHtml(formattedAmount)}</span></div></td>
        </tr>
      </tbody>
    </table>

    <div class="footer-notes">
      <p>If you have any questions concerning this invoice, use the following contact information:</p>
      <p class="contact-info"><a href="mailto:dulshanperera011@gmail.com">Rasantha Dulshan (Treasurer), +94 75 2515524, dulshanperera011@gmail.com</a></p>
      <p>Thank you for your Contribution!</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  renderForm,
  renderInvoice
};
