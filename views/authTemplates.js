function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderAuthPage({ type = 'login', errors = [], formData = {} }) {
  const isLogin = type === 'login';
  const title = isLogin ? 'Access Terminal' : 'Board Registration';
  const subtitle = isLogin ? 'Authenticate to access secure records.' : 'Create secure board member credentials.';
  const actionUrl = isLogin ? '/login' : '/register';
  const submitText = isLogin ? 'Authenticate Securely' : 'Initialize Account';
  const toggleText = isLogin ? 'Request access (Sign Up)' : 'Return to Login';
  const toggleUrl = isLogin ? '/register' : '/login';

  const { username = "" } = formData;

  const errorHtml = errors.length > 0 ? `
      <div class="alert fade-in" role="alert">
        <strong><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Authorization Error</strong>
        <ul>
          ${errors.map(err => `<li>${escapeHtml(err)}</li>`).join("\\n          ")}
        </ul>
      </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Nexus System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css" />
  <style>
    /* Auth Page specific overrides to center the panel */
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .auth-shell {
      position: relative;
      background: rgba(13, 17, 26, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 
        0 30px 60px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 480px;
      z-index: 10;
      animation: float-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-title {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .auth-subtitle {
     color: #94a3b8;
     font-size: 0.95rem;
    }
    .auth-footer {
      margin-top: 1.5rem;
      text-align: center;
    }
    .auth-link {
      color: #818cf8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.3s ease;
    }
    .auth-link:hover {
      color: #a5b4fc;
      text-decoration: underline;
    }
    .brand-logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    .brand-icon-large {
      color: #6366f1;
      filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.4));
    }
  </style>
</head>
<body class="theme-dark">
  <!-- Cinematic Background Elements -->
  <div class="bg-orb orb-primary"></div>
  <div class="bg-orb orb-secondary"></div>
  <div class="bg-orb orb-accent"></div>
  <div class="bg-noise"></div>
  <div class="bg-grid"></div>

  <div class="auth-shell fade-up">
    <div class="shell-highlight-top"></div>
    
    <div class="brand-logo-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="brand-icon-large"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
    </div>

    <div class="auth-header">
      <h1 class="auth-title">${title}</h1>
      <p class="auth-subtitle">${subtitle}</p>
    </div>

    ${errorHtml}

    <form action="${actionUrl}" method="POST" class="form-grid">
      
      <div class="input-group">
        <label for="username">System ID (Username)</label>
        <div class="input-glow-wrapper">
          <input type="text" id="username" name="username" class="glass-input" placeholder="Enter board credential ID" value="${escapeHtml(username)}" required autocomplete="off" />
        </div>
      </div>

      <div class="input-group">
        <label for="password">Access Key (Password)</label>
        <div class="input-glow-wrapper">
          <input type="password" id="password" name="password" class="glass-input" placeholder="••••••••" required />
        </div>
      </div>

      ${!isLogin ? `
      <div class="input-group">
        <label for="confirmPassword">Verify Access Key</label>
        <div class="input-glow-wrapper">
          <input type="password" id="confirmPassword" name="confirmPassword" class="glass-input" placeholder="••••••••" required />
        </div>
      </div>
      ` : ''}

      <div class="action-bar" style="margin-top: 1.5rem;">
        <button type="submit" class="btn-generate" style="width: 100%;">
          <span class="btn-glow-effect"></span>
          <span class="btn-content" style="justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            ${submitText}
          </span>
        </button>
      </div>

      <div class="auth-footer">
        <a href="${toggleUrl}" class="auth-link">${toggleText}</a>
      </div>
    </form>
  </div>
</body>
</html>`;
}

module.exports = {
  renderAuthPage
};
