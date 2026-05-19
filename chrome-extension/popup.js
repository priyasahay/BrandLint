const BL_HOST = 'http://localhost:3000';
let currentUrl = '';

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentUrl = tabs[0]?.url || '';
  const urlEl = document.getElementById('current-url');
  const btn = document.getElementById('analyze-btn');

  if (!currentUrl.startsWith('http')) {
    urlEl.textContent = 'Not a web page — navigate to a portfolio site first';
    urlEl.style.color = '#8b90b8';
    btn.disabled = true;
    return;
  }

  try {
    const parsed = new URL(currentUrl);
    urlEl.textContent = parsed.hostname + parsed.pathname.replace(/\/$/, '');
  } catch {
    urlEl.textContent = currentUrl;
  }
});

document.getElementById('analyze-btn').addEventListener('click', async () => {
  const btn = document.getElementById('analyze-btn');
  const btnText = document.getElementById('btn-text');
  const resultEl = document.getElementById('result');
  const errorEl = document.getElementById('error-msg');
  const openLink = document.getElementById('open-link');

  btn.disabled = true;
  btnText.textContent = 'Analyzing...';
  resultEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  openLink.classList.add('hidden');

  try {
    const res = await fetch(`${BL_HOST}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    renderResult(data);
    openLink.href = `${BL_HOST}?url=${encodeURIComponent(currentUrl)}`;
    openLink.classList.remove('hidden');
  } catch (err) {
    const isFetchFail = err instanceof TypeError && err.message.includes('fetch');
    errorEl.textContent = isFetchFail
      ? 'BrandLint is not running. Open your terminal and run: npm start'
      : err.message;
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Analyze this page';
  }
});

function renderResult(data) {
  const { scores, issues } = data;
  const resultEl = document.getElementById('result');
  const color = scoreColor(scores.overall);
  const grade = scoreGrade(scores.overall);
  const topErrors = issues.filter(i => i.severity === 'error').slice(0, 3);

  resultEl.innerHTML = `
    <div class="score-row">
      <div class="score-circle" style="border-color:${color}">
        <span class="score-val" style="color:${color}">${scores.overall}</span>
        <span class="score-denom">/100</span>
      </div>
      <div class="score-info">
        <div class="score-grade" style="color:${color}">${grade}</div>
        <div class="score-label">Brand Score</div>
        <div class="dim-bars">
          ${dimBar('Clarity', scores.clarity)}
          ${dimBar('Impact', scores.impact)}
          ${dimBar('Credibility', scores.credibility)}
          ${dimBar('Attention', scores.attention)}
          ${dimBar('Actionability', scores.actionability)}
        </div>
      </div>
    </div>
    ${topErrors.length ? `
      <div class="issues-title">Top issues to fix</div>
      ${topErrors.map(i => `
        <div class="issue-item">
          <span class="issue-dim">${i.dimension}</span>
          <span class="issue-msg">${escapeHtml(i.message)}</span>
        </div>
      `).join('')}
    ` : '<div class="no-issues">✓ No critical issues found!</div>'}
  `;
  resultEl.classList.remove('hidden');
}

function dimBar(label, score) {
  return `
    <div class="dim-bar-row">
      <span class="dim-name">${label}</span>
      <div class="dim-track"><div class="dim-fill" style="width:${score}%;background:${scoreColor(score)}"></div></div>
      <span class="dim-val" style="color:${scoreColor(score)}">${score}</span>
    </div>`;
}

function scoreColor(s) {
  if (s >= 75) return '#22c55e';
  if (s >= 50) return '#f59e0b';
  if (s >= 25) return '#ef4444';
  return '#dc2626';
}

function scoreGrade(s) {
  if (s >= 80) return 'Excellent';
  if (s >= 65) return 'Good';
  if (s >= 45) return 'Fair';
  if (s >= 25) return 'Needs Work';
  return 'Critical';
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
