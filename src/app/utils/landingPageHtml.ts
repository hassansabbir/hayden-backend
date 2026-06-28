import mongoose from 'mongoose';

export const getLandingPageHtml = (port: number, envName: string): string => {
  const readyStateMap: Record<number, { text: string; class: string }> = {
    0: { text: 'Disconnected', class: 'status-disconnected' },
    1: { text: 'Connected', class: 'status-connected' },
    2: { text: 'Connecting', class: 'status-connecting' },
    3: { text: 'Disconnecting', class: 'status-disconnecting' },
  };

  const dbState = readyStateMap[mongoose.connection.readyState] || { text: 'Unknown', class: 'status-unknown' };
  const uptimeHours = Math.floor(process.uptime() / 3600);
  const uptimeMinutes = Math.floor((process.uptime() % 3600) / 60);
  const uptimeSeconds = Math.floor(process.uptime() % 60);
  const uptimeStr = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

  // Define endpoints data structure
  const endpointCategories = [
    {
      id: 'auth',
      name: 'Authentication',
      description: 'Endpoints handling user signup, logging in, logging out, and token refreshes.',
      endpoints: [
        { method: 'POST', path: '/api/v1/auth/register', desc: 'Create a new golfer or partner account' },
        { method: 'POST', path: '/api/v1/auth/login', desc: 'Authenticate and receive access cookie & token' },
        { method: 'POST', path: '/api/v1/auth/logout', desc: 'Clear session tokens and log out' },
        { method: 'POST', path: '/api/v1/auth/refresh-token', desc: 'Acquire new access token using refresh token' },
      ],
    },
    {
      id: 'users',
      name: 'Users',
      description: 'Manage golfer and administrator profiles.',
      endpoints: [
        { method: 'GET', path: '/api/v1/users/me', desc: 'Retrieve current profile' },
        { method: 'PATCH', path: '/api/v1/users/me', desc: 'Update profile information' },
      ],
    },
    {
      id: 'courses',
      name: 'Golf Courses',
      description: 'Browse, create, and manage golf courses.',
      endpoints: [
        { method: 'GET', path: '/api/v1/courses', desc: 'List golf courses with location/pricing filters' },
        { method: 'GET', path: '/api/v1/courses/:id', desc: 'Fetch detailed data for a specific course' },
        { method: 'POST', path: '/api/v1/courses', desc: 'Add a new golf course (Admin only)' },
        { method: 'PATCH', path: '/api/v1/courses/:id', desc: 'Update course details (Admin only)' },
        { method: 'DELETE', path: '/api/v1/courses/:id', desc: 'Delete course from catalog (Admin only)' },
      ],
    },
    {
      id: 'reviews',
      name: 'Reviews',
      description: 'Course reviews and golfer feedback.',
      endpoints: [
        { method: 'GET', path: '/api/v1/courses/:id/reviews', desc: 'Get all reviews for a golf course' },
        { method: 'POST', path: '/api/v1/courses/:id/reviews', desc: 'Submit a new review' },
      ],
    },
    {
      id: 'tee-times',
      name: 'Tee Times',
      description: 'Check available tee-times slots.',
      endpoints: [
        { method: 'GET', path: '/api/v1/tee-times', desc: 'Query active golf tee-times slots' },
        { method: 'POST', path: '/api/v1/tee-times', desc: 'Generate tee-times slots (Admin only)' },
      ],
    },
    {
      id: 'bookings',
      name: 'Bookings',
      description: 'Manage golf reservations and schedules.',
      endpoints: [
        { method: 'GET', path: '/api/v1/bookings', desc: 'Retrieve user bookings / Admin list' },
        { method: 'GET', path: '/api/v1/bookings/:id', desc: 'View single booking details' },
        { method: 'POST', path: '/api/v1/bookings', desc: 'Book a golf tee-time' },
        { method: 'PATCH', path: '/api/v1/bookings/:id/cancel', desc: 'Cancel booking' },
      ],
    },
    {
      id: 'memberships',
      name: 'Memberships',
      description: 'Exclusive golf course club memberships.',
      endpoints: [
        { method: 'GET', path: '/api/v1/memberships', desc: 'Retrieve membership programs' },
        { method: 'POST', path: '/api/v1/memberships/subscribe', desc: 'Subscribe to a membership plan' },
      ],
    },
    {
      id: 'payments',
      name: 'Payments',
      description: 'Payment gateway integrations.',
      endpoints: [
        { method: 'POST', path: '/api/v1/payments/checkout', desc: 'Create Checkout session for bookings' },
        { method: 'POST', path: '/api/v1/payments/webhook', desc: 'Stripe webhook receiver' },
      ],
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Metrics for administrators.',
      endpoints: [
        { method: 'GET', path: '/api/v1/dashboard/stats', desc: 'Fetch analytics and business metrics' },
      ],
    },
    {
      id: 'media',
      name: 'Media',
      description: 'Upload assets and golf course imagery.',
      endpoints: [
        { method: 'POST', path: '/api/v1/media/upload', desc: 'Upload file / image to uploads storage' },
      ],
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Real-time alerts and user messaging.',
      endpoints: [
        { method: 'GET', path: '/api/v1/notifications', desc: 'Retrieve notification history' },
      ],
    },
  ];

  // Render endpoint cards
  const categoryTabs = endpointCategories
    .map(
      (cat) => `<button class="tab-btn" onclick="filterCategory(this, '${cat.id}')">${cat.name}</button>`
    )
    .join('\n');

  const categoryGroups = endpointCategories
    .map((cat) => {
      const rows = cat.endpoints
        .map((ep) => {
          const methodClass = `method-${ep.method.toLowerCase()}`;
          return `
            <div class="endpoint-row">
              <div class="endpoint-meta">
                <span class="method-badge ${methodClass}">${ep.method}</span>
                <code class="endpoint-path">${ep.path}</code>
              </div>
              <div class="endpoint-desc">${ep.desc}</div>
              <div class="endpoint-actions">
                <button class="copy-btn" onclick="copyPath('${ep.path}')" title="Copy Endpoint Path">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="endpoint-group" id="group-${cat.id}" data-category="${cat.id}">
          <div class="group-header">
            <h3>${cat.name}</h3>
            <p>${cat.description}</p>
          </div>
          <div class="endpoint-list">
            ${rows}
          </div>
        </div>
      `;
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tea-It-Up API Service</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #070d0a;
      --bg-card: #0e1713;
      --bg-card-hover: #14241d;
      --primary: #10B981;
      --primary-hover: #34D399;
      --primary-glow: rgba(16, 185, 129, 0.15);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --border-color: rgba(16, 185, 129, 0.12);
      
      --color-get: #10B981;
      --color-post: #0ea5e9;
      --color-patch: #f59e0b;
      --color-delete: #ef4444;
      
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.6;
      overflow-x: hidden;
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 40%),
        linear-gradient(rgba(14, 23, 19, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(14, 23, 19, 0.3) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 2.2rem;
      background: var(--primary-glow);
      padding: 8px 12px;
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .logo-text h1 {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 30%, var(--primary-hover) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .logo-text p {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .pulse-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 9999px;
      color: var(--primary-hover);
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.05);
    }

    .pulse-dot {
      width: 10px;
      height: 10px;
      background-color: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    /* System Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }

    .stat-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      border-color: rgba(16, 185, 129, 0.3);
      box-shadow: 0 15px 35px rgba(16, 185, 129, 0.05);
    }

    .stat-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: #ffffff;
    }

    .status-connected {
      color: var(--primary-hover);
    }
    .status-disconnected {
      color: var(--color-delete);
    }
    .status-connecting {
      color: var(--color-patch);
    }

    /* API Explorer Section */
    .api-explorer {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .explorer-header {
      margin-bottom: 28px;
    }

    .explorer-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 6px;
      color: #ffffff;
    }

    .explorer-header p {
      font-size: 0.95rem;
      color: var(--text-muted);
    }

    /* Navigation / Tabs */
    .tabs-wrapper {
      position: relative;
      margin-bottom: 32px;
    }

    .tabs-container {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      scrollbar-width: thin;
      scrollbar-color: var(--primary) var(--bg-dark);
    }

    .tabs-container::-webkit-scrollbar {
      height: 4px;
    }

    .tabs-container::-webkit-scrollbar-thumb {
      background-color: rgba(16, 185, 129, 0.2);
      border-radius: 2px;
    }

    .tab-btn {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-muted);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 10px 20px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background: rgba(16, 185, 129, 0.08);
      color: #ffffff;
      border-color: rgba(16, 185, 129, 0.25);
    }

    .tab-btn.active {
      background: var(--primary);
      color: var(--bg-dark);
      border-color: var(--primary);
      box-shadow: 0 4px 14px var(--primary-glow);
    }

    /* Endpoint Groups */
    .endpoint-group {
      animation: fadeIn 0.3s ease;
      margin-bottom: 32px;
    }

    .group-header {
      margin-bottom: 16px;
      padding-left: 4px;
    }

    .group-header h3 {
      font-size: 1.25rem;
      color: #ffffff;
      font-weight: 700;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .group-header h3::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 18px;
      background: var(--primary);
      border-radius: 2px;
    }

    .group-header p {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .endpoint-row {
      background: var(--bg-dark);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      transition: all 0.2s ease;
    }

    .endpoint-row:hover {
      background: var(--bg-card-hover);
      border-color: rgba(16, 185, 129, 0.2);
      transform: translateX(4px);
    }

    .endpoint-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    .method-badge {
      display: inline-block;
      width: 76px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 6px 0;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }

    .method-get {
      background: rgba(16, 185, 129, 0.08);
      color: var(--color-get);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .method-post {
      background: rgba(14, 165, 233, 0.08);
      color: var(--color-post);
      border: 1px solid rgba(14, 165, 233, 0.2);
    }

    .method-patch {
      background: rgba(245, 158, 11, 0.08);
      color: var(--color-patch);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .method-delete {
      background: rgba(239, 68, 110, 0.08);
      color: var(--color-delete);
      border: 1px solid rgba(239, 68, 110, 0.2);
    }

    .endpoint-path {
      font-family: var(--font-mono);
      font-size: 0.95rem;
      color: #e5e7eb;
      font-weight: 500;
    }

    .endpoint-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      flex-grow: 1;
    }

    .endpoint-actions {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .copy-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--primary-hover);
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--bg-card);
      border: 1px solid var(--primary);
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      font-weight: 600;
      font-size: 0.9rem;
      z-index: 1000;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    footer {
      text-align: center;
      margin-top: 48px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    footer a {
      color: var(--primary-hover);
      text-decoration: none;
      font-weight: 500;
    }

    footer a:hover {
      text-decoration: underline;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .endpoint-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .endpoint-meta {
        width: 100%;
        justify-content: space-between;
      }
      .endpoint-desc {
        width: 100%;
      }
      .endpoint-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-container">
        <span class="logo-icon">⛳</span>
        <div class="logo-text">
          <h1>Tea-It-Up</h1>
          <p>REST API Platform v1.0.0</p>
        </div>
      </div>
      <div class="pulse-badge">
        <span class="pulse-dot"></span>
        API Service Online
      </div>
    </header>

    <main>
      <!-- Systems Grid -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Environment</div>
          <div class="stat-value" style="color: ${envName === 'production' ? 'var(--color-delete)' : 'var(--color-patch)'}">${envName.toUpperCase()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Server Port</div>
          <div class="stat-value">${port}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Database Status</div>
          <div class="stat-value ${dbState.class}">${dbState.text}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Uptime</div>
          <div class="stat-value" id="uptime-value" style="color: var(--primary-hover); font-family: var(--font-mono); font-size: 1.25rem;">${uptimeStr}</div>
        </div>
      </section>

      <!-- API Explorer -->
      <section class="api-explorer">
        <div class="explorer-header">
          <h2>API Endpoint Explorer</h2>
          <p>Explore the endpoints supported by the Tea-It-Up gateway. Click tabs to filter.</p>
        </div>

        <div class="tabs-wrapper">
          <div class="tabs-container">
            <button class="tab-btn active" onclick="filterCategory(this, 'all')">All Modules</button>
            ${categoryTabs}
          </div>
        </div>

        <div id="endpoint-groups-container">
          ${categoryGroups}
        </div>
      </section>
    </main>

    <footer>
      <p>&copy; ${new Date().getFullYear()} Tea-It-Up. All rights reserved. | <a href="/health" target="_blank">View /health JSON</a></p>
    </footer>
  </div>

  <div class="toast" id="toast">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    Path copied to clipboard!
  </div>

  <script>
    function filterCategory(btn, catId) {
      const groups = document.querySelectorAll('.endpoint-group');
      const tabs = document.querySelectorAll('.tab-btn');
      
      tabs.forEach(tab => {
        tab.classList.remove('active');
      });
      btn.classList.add('active');

      groups.forEach(group => {
        if (catId === 'all' || group.dataset.category === catId) {
          group.style.display = 'block';
        } else {
          group.style.display = 'none';
        }
      });
    }

    function copyPath(path) {
      const fullUrl = window.location.origin + path;
      navigator.clipboard.writeText(fullUrl).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }

    // Uptime ticker
    let uptimeSeconds = ${Math.floor(process.uptime())};
    setInterval(() => {
      uptimeSeconds++;
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const secs = Math.floor(uptimeSeconds % 60);
      document.getElementById('uptime-value').innerText = hours + 'h ' + minutes + 'm ' + secs + 's';
    }, 1000);
  </script>
</body>
</html>
  `;
};
