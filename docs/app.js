const API = '';
const IS_DEMO = window.location.hostname.includes('github.io');
let radarChart = null;
let evolutionChart = null;
let voiceChart = null;
let currentFilter = 'all';
let currentResult = null;
let loadingInterval = null;

const form = document.getElementById('analyze-form');
const urlInput = document.getElementById('url-input');
const analyzeBtn = document.getElementById('analyze-btn');
const btnText = document.getElementById('btn-text');
const statusEl = document.getElementById('status');
const loadingOverlay = document.getElementById('loading-overlay');
const results = document.getElementById('results');

// ─── Example chips ────────────────────────────────────────────────────────────
document.querySelectorAll('.example-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    urlInput.value = chip.dataset.url;
    urlInput.focus();
    form.dispatchEvent(new Event('submit'));
  });
});

// ─── Analyze another ──────────────────────────────────────────────────────────
function scrollToHero() {
  document.body.classList.remove('has-results');
  document.querySelector('.hero').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => urlInput.focus(), 600);
}
document.getElementById('analyze-another-btn').addEventListener('click', scrollToHero);
document.getElementById('analyze-new-btn').addEventListener('click', scrollToHero);

// ─── Form submit ──────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  if (IS_DEMO) {
    showError('This is a live preview — to run analysis, clone the repo and start the server locally. See the README for setup instructions.');
    return;
  }

  analyzeBtn.disabled = true;
  btnText.textContent = 'Analyzing...';
  statusEl.classList.add('hidden');
  results.classList.add('hidden');
  showLoading();

  try {
    const res = await fetch(`${API}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Analysis failed');
    }

    currentResult = await res.json();
    hideLoading();
    document.body.classList.add('has-results');
    renderResults(currentResult);
    loadHistory();
    results.classList.remove('hidden');
    setTimeout(() => results.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  } catch (err) {
    hideLoading();
    showError(err.message);
  } finally {
    analyzeBtn.disabled = false;
    btnText.textContent = 'Analyze';
  }
});

// ─── Loading ──────────────────────────────────────────────────────────────────
function showLoading() {
  loadingOverlay.classList.remove('hidden');
  const steps = document.querySelectorAll('.lstep');
  const bar = document.getElementById('loading-bar');
  let step = 0;
  steps.forEach(s => { s.classList.remove('active', 'done'); });
  steps[0].classList.add('active');
  bar.style.width = '10%';

  loadingInterval = setInterval(() => {
    if (step < steps.length - 1) {
      steps[step].classList.remove('active');
      steps[step].classList.add('done');
      step++;
      steps[step].classList.add('active');
      bar.style.width = `${10 + step * 25}%`;
    }
  }, 1200);
}

function hideLoading() {
  clearInterval(loadingInterval);
  document.getElementById('loading-bar').style.width = '100%';
  setTimeout(() => loadingOverlay.classList.add('hidden'), 300);
}

function showError(msg) {
  statusEl.textContent = msg;
  statusEl.className = 'status error';
  statusEl.classList.remove('hidden');
  statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── Render Results ───────────────────────────────────────────────────────────
function renderResults(data) {
  const { scores, issues, insights } = data;

  // URL row
  document.getElementById('analyzed-url').textContent = data.url;
  const badge = document.getElementById('analyzed-score-badge');
  badge.textContent = `${scores.overall}/100`;
  badge.style.color = getScoreColor(scores.overall);

  // Animated ring
  const circle = document.getElementById('overall-circle');
  const circumference = 2 * Math.PI * 52;
  circle.style.stroke = getScoreColor(scores.overall);
  setTimeout(() => {
    circle.style.strokeDashoffset = circumference - (scores.overall / 100) * circumference;
  }, 100);

  // Animated score counter
  animateCount(document.getElementById('overall-score'), scores.overall);

  // Score grade label
  const gradeEl = document.getElementById('score-grade');
  gradeEl.textContent = getScoreGrade(scores.overall);
  gradeEl.style.color = getScoreColor(scores.overall);

  // Dimension scores
  const dims = ['clarity', 'impact', 'credibility', 'attention', 'actionability'];
  dims.forEach((dim, i) => {
    const fill = document.querySelector(`[data-fill="${dim}"]`);
    const val = document.querySelector(`[data-dim-val="${dim}"]`);
    setTimeout(() => {
      fill.style.width = `${scores[dim]}%`;
      fill.style.background = getScoreColor(scores[dim]);
    }, 100 + i * 80);
    setTimeout(() => animateCount(val, scores[dim]), 100 + i * 80);
    val.style.color = getScoreColor(scores[dim]);
  });

  renderRadarChart(scores);
  loadEvolution(data.url);
  renderInsights(insights);
  renderIssues(issues);

  if (data.archetype) renderArchetype(data.archetype);
  if (data.voice) renderVoice(data.voice);

  // Reset to Insights tab
  activateTab(document.querySelector('.ftab[data-target="insights-section"]'));

  // Update issues tab count
  document.getElementById('ftab-issue-count').textContent = issues.length || '';

  setTimeout(initReveal, 200);
}

// ─── Score grade ──────────────────────────────────────────────────────────────
function getScoreGrade(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Fair';
  if (score >= 25) return 'Needs Work';
  return 'Critical';
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function animateCount(el, target, duration = 900) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
}

// ─── Score color ──────────────────────────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 25) return '#ef4444';
  return '#dc2626';
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────
function renderRadarChart(scores) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? '#1d1f35' : '#e8eaf6';
  const labelColor = isDark ? '#8b90b8' : '#5a6080';
  const ctx = document.getElementById('radar-chart').getContext('2d');
  const labels = ['Clarity', 'Impact', 'Credibility', 'Attention', 'Actionability'];
  const values = [scores.clarity, scores.impact, scores.credibility, scores.attention, scores.actionability];
  if (radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: 'rgba(124,58,237,0.12)',
        borderColor: '#7c3aed',
        borderWidth: 2,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: isDark ? '#030309' : '#f4f5ff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true, animation: { duration: 1000 },
      scales: {
        r: {
          beginAtZero: true, max: 100,
          ticks: { stepSize: 25, color: gridColor, backdropColor: 'transparent' },
          grid: { color: gridColor }, angleLines: { color: gridColor },
          pointLabels: { color: labelColor, font: { size: 11, family: 'Inter' } },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// ─── Evolution Chart ──────────────────────────────────────────────────────────
async function loadEvolution(url) {
  try {
    const res = await fetch(`${API}/api/history/${encodeURIComponent(url)}`);
    const entries = await res.json();
    const noEvolution = document.getElementById('no-evolution');
    if (entries.length < 2) {
      noEvolution.classList.remove('hidden');
      if (evolutionChart) { evolutionChart.destroy(); evolutionChart = null; }
      return;
    }
    noEvolution.classList.add('hidden');
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? '#1d1f35' : '#e8eaf6';
    const tickColor = isDark ? '#8b90b8' : '#5a6080';
    const sorted = [...entries].reverse();
    const labels = sorted.map(e => new Date(e.createdAt).toLocaleDateString());
    const dims = ['clarity', 'impact', 'credibility', 'attention', 'actionability'];
    const colors = ['#7c3aed', '#0ea5e9', '#f59e0b', '#ef4444', '#22c55e'];
    const ctx = document.getElementById('evolution-chart').getContext('2d');
    if (evolutionChart) evolutionChart.destroy();
    evolutionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: dims.map((dim, i) => ({
          label: dim.charAt(0).toUpperCase() + dim.slice(1),
          data: sorted.map(e => e.scores[dim]),
          borderColor: colors[i], backgroundColor: 'transparent',
          borderWidth: 2, tension: 0.4, pointRadius: 3,
        })),
      },
      options: {
        responsive: true, animation: { duration: 800 },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { color: tickColor }, grid: { color: gridColor } },
          x: { ticks: { color: tickColor }, grid: { color: gridColor } },
        },
        plugins: { legend: { labels: { color: tickColor, boxWidth: 10, font: { size: 11 } } } },
      },
    });
  } catch {
    document.getElementById('no-evolution').classList.remove('hidden');
  }
}

// ─── Insights ─────────────────────────────────────────────────────────────────
function renderInsights(insights) {
  const section = document.getElementById('insights-section');
  document.getElementById('insight-summary').textContent = insights.summary;
  const sl = document.getElementById('strengths-list');
  const il = document.getElementById('improvements-list');
  sl.innerHTML = (insights.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
  il.innerHTML = (insights.improvements || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
  section.style.display = insights.summary ? '' : 'none';
}

// ─── Issues ───────────────────────────────────────────────────────────────────
function renderIssues(issues) {
  document.getElementById('issue-count').textContent = issues.length;
  applyIssueFilter(issues);
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.severity;
      applyIssueFilter(issues);
    });
  });
}

function applyIssueFilter(issues) {
  const list = document.getElementById('issues-list');
  const filtered = currentFilter === 'all' ? issues : issues.filter(i => i.severity === currentFilter);
  if (!filtered.length) {
    list.innerHTML = '<p class="muted" style="padding:0.75rem 0">No issues in this category</p>';
    return;
  }
  list.innerHTML = filtered.map(issue => `
    <div class="issue-item" data-severity="${issue.severity}">
      <span class="issue-severity ${issue.severity}">${issue.severity === 'info' ? 'tip' : issue.severity}</span>
      <span class="issue-dim">${issue.dimension}</span>
      <span class="issue-msg">${escapeHtml(issue.message)}</span>
    </div>
  `).join('');
}

// ─── Feature Tabs ─────────────────────────────────────────────────────────────
function activateTab(tabBtn) {
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  tabBtn.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('panel-active'));
  const panel = document.getElementById(tabBtn.dataset.target);
  if (panel) {
    panel.classList.add('panel-active');
    // Re-trigger reveal for freshly shown panel
    panel.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'));
  }
}

document.getElementById('feature-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.ftab');
  if (btn) activateTab(btn);
});

// ─── Reveal on scroll ─────────────────────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── Archetype ────────────────────────────────────────────────────────────────
function renderArchetype(archetype) {
  const { primary, secondary, all, confidence } = archetype;
  document.getElementById('archetype-primary-card').innerHTML = `
    <div class="arch-emoji">${primary.emoji}</div>
    <div class="arch-primary-body">
      <div class="arch-primary-name">${primary.name}</div>
      <div class="arch-tagline">${primary.tagline}</div>
      <div class="arch-description">${primary.description}</div>
      <div class="arch-traits">${primary.brandTraits.map(t => `<span class="arch-trait">${t}</span>`).join('')}</div>
    </div>
    <div class="arch-confidence">
      <div class="arch-confidence-value">${confidence}%</div>
      <div class="arch-confidence-label">confidence</div>
    </div>
  `;
  document.getElementById('archetype-secondary-row').innerHTML = `
    <span style="color:var(--text-muted)">Secondary archetype:</span>
    <span class="arch-secondary-emoji">${secondary.emoji}</span>
    <span class="arch-secondary-name">${secondary.name}</span>
    <span style="color:var(--text-muted);font-style:italic">${secondary.tagline}</span>
  `;
  const top8 = all.slice(0, 8);
  const maxScore = top8[0]?.score || 1;
  document.getElementById('archetype-bar-chart').innerHTML = top8.map((a, i) => `
    <div class="arch-bar-row ${i === 0 ? 'arch-bar-primary' : i === 1 ? 'arch-bar-secondary' : ''}">
      <span style="text-align:center">${a.emoji}</span>
      <span class="arch-bar-name">${a.name}</span>
      <div class="arch-bar-track"><div class="arch-bar-fill" style="width:0" data-target="${Math.round((a.score/maxScore)*100)}"></div></div>
      <span class="arch-bar-score" style="color:var(--text-muted)">${a.score}</span>
    </div>
  `).join('');
  setTimeout(() => {
    document.querySelectorAll('.arch-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  }, 200);
}

// ─── Voice Fingerprint ────────────────────────────────────────────────────────
function renderVoice(voice) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? '#1d1f35' : '#e8eaf6';
  const labelColor = isDark ? '#8b90b8' : '#5a6080';
  const ctx = document.getElementById('voice-chart').getContext('2d');
  if (voiceChart) voiceChart.destroy();
  voiceChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Rhythm', 'Richness', 'Active Voice', 'Audience Focus', 'Formality', 'Consistency'],
      datasets: [{
        data: [voice.rhythm, voice.richness, voice.activeVoice, voice.audienceFocus, voice.formality, voice.consistency],
        backgroundColor: 'rgba(14,165,233,0.1)',
        borderColor: '#0ea5e9', borderWidth: 2,
        pointBackgroundColor: '#0ea5e9', pointBorderColor: isDark ? '#030309' : '#f4f5ff',
        pointBorderWidth: 2, pointRadius: 5,
      }],
    },
    options: {
      responsive: true, animation: { duration: 1000 },
      scales: {
        r: {
          beginAtZero: true, max: 100,
          ticks: { stepSize: 25, color: gridColor, backdropColor: 'transparent' },
          grid: { color: gridColor }, angleLines: { color: gridColor },
          pointLabels: { color: labelColor, font: { size: 11, family: 'Inter' } },
        },
      },
      plugins: { legend: { display: false } },
    },
  });

  const d = voice.details;
  document.getElementById('voice-details').innerHTML = `
    <div class="voice-summary">${escapeHtml(voice.summary)}</div>
    <div class="voice-metrics">
      ${vm('Avg sentence', d.avgSentenceLength + ' words')}
      ${vm('Sentence variety', '±' + d.sentenceLengthVariance + ' words')}
      ${vm('Vocab richness', d.uniqueWordRatio + '% unique')}
      ${vm('Audience focus', d.youVsIRatio + '% "you" vs "I"')}
      ${vm('Active voice', d.activeCount + ' constructions')}
      ${vm('Passive voice', d.passiveCount + ' constructions')}
      ${vm('Avg word length', d.avgWordLength + ' chars')}
    </div>
    <div class="voice-dim-bars">
      ${vbar('Rhythm', voice.rhythm, 'Do your sentences vary in length? A mix of short and long sentences keeps readers engaged and your writing feels natural.')}
      ${vbar('Richness', voice.richness, 'How varied is your vocabulary? High richness means you use many different words — a sign of expressive, non-repetitive writing.')}
      ${vbar('Active Voice', voice.activeVoice, 'Do you write "I built this" or "this was built"? Active voice sounds stronger and more confident to readers.')}
      ${vbar('Audience Focus', voice.audienceFocus, 'Do you say "you" more than "I"? Writing that focuses on the reader (not yourself) comes across as more engaging and helpful.')}
      ${vbar('Formality', voice.formality, 'Is your writing formal or casual? A mid-range score works best for most personal brands — professional but not stiff.')}
      ${vbar('Consistency', voice.consistency, 'Is your tone the same throughout the page? Consistent writing feels polished and trustworthy.')}
    </div>
  `;
  setTimeout(() => {
    document.querySelectorAll('.vdb-fill').forEach(el => {
      el.style.width = el.dataset.w + '%';
    });
  }, 300);
}

function vm(label, value) {
  return `<div class="voice-metric"><span class="vm-label">${label}</span><span class="vm-value">${value}</span></div>`;
}
function vbar(label, score, desc) {
  return `
    <div class="vdb-row">
      <div class="vdb-header">
        <span class="vdb-label">${label}</span>
        <span class="vdb-score" style="color:${getScoreColor(score)}">${score}</span>
      </div>
      <div class="vdb-track"><div class="vdb-fill" style="width:0;background:${getScoreColor(score)}" data-w="${score}"></div></div>
      <span class="vdb-desc">${desc}</span>
    </div>`;
}

// ─── History ──────────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const res = await fetch(`${API}/api/history`);
    const entries = await res.json();
    const list = document.getElementById('history-list');
    const hint = document.getElementById('history-hint');
    if (!entries.length) {
      list.innerHTML = '<p class="muted">No analyses yet — paste a URL above to get started</p>';
      hint.style.display = 'none';
      return;
    }
    hint.style.display = '';
    const seen = new Set();
    list.innerHTML = entries.filter(e => !seen.has(e.url) && seen.add(e.url)).map(entry => `
      <div class="history-item" data-url="${escapeHtml(entry.url)}" title="Click to re-analyze">
        <span class="history-icon">⊙</span>
        <span class="history-url">${escapeHtml(entry.url)}</span>
        <div class="history-meta">
          <span class="history-date">${new Date(entry.createdAt).toLocaleDateString()}</span>
          <span class="history-grade" style="color:${getScoreColor(entry.scores.overall)}">${getScoreGrade(entry.scores.overall)}</span>
          <span class="history-score" style="color:${getScoreColor(entry.scores.overall)}">${entry.scores.overall}</span>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        urlInput.value = item.dataset.url;
        form.dispatchEvent(new Event('submit'));
        document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
      });
    });
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const apply = (t) => {
    root.setAttribute('data-theme', t);
    icon.textContent = t === 'dark' ? '☀' : '☽';
    localStorage.setItem('bl-theme', t);
  };
  apply(localStorage.getItem('bl-theme') || 'dark');
  btn.addEventListener('click', () => apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
})();

loadHistory();

// Pre-fill URL from query param (used by Chrome extension "View full report" link)
(function () {
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('url');
  if (urlParam) {
    urlInput.value = urlParam;
    form.dispatchEvent(new Event('submit'));
  }
})();

// ─── Hero canvas — particle network + meteors ─────────────────────────────────
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const N = 52;
  const LINK_DIST = 120;
  const PALETTE = [[124,58,237],[14,165,233],[167,139,250],[56,189,248]];
  let W, H, pts, meteors = [], animId;
  let mx = -9999, my = -9999;
  let nextMeteorAt = 4000;

  class Dot {
    constructor(init) { this.spawn(init); }
    spawn(init) {
      this.x  = init ? Math.random() * W : (Math.random() < 0.5 ? -8 : W + 8);
      this.y  = init ? Math.random() * H : Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.32;
      this.vy = (Math.random() - 0.5) * 0.22;
      this.r  = Math.random() * 1.7 + 0.7;
      this.c  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.ba = Math.random() * 0.45 + 0.2;
      this.ph = Math.random() * Math.PI * 2;
      this.ps = 0.007 + Math.random() * 0.013;
    }
    step() {
      this.ph += this.ps;
      const dx = mx - this.x, dy = my - this.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 160 && d > 1) {
        this.vx += (dx / d) * 0.004;
        this.vy += (dy / d) * 0.004;
        this.vx *= 0.97; this.vy *= 0.97;
      }
      this.x += this.vx; this.y += this.vy;
      if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) this.spawn(false);
    }
    draw() {
      const a = this.ba + Math.sin(this.ph) * 0.12;
      const r = this.r  + Math.sin(this.ph) * 0.35;
      const [ri, gi, bi] = this.c;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle  = `rgb(${ri},${gi},${bi})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgb(${ri},${gi},${bi})`;
      ctx.fill();
      ctx.restore();
    }
  }

  class Meteor {
    constructor() {
      this.x   = Math.random() * W * 0.6 + W * 0.1;
      this.y   = -5;
      this.len = 55 + Math.random() * 90;
      this.spd = 3.5 + Math.random() * 4;
      this.ang = Math.PI / 4 + (Math.random() - 0.5) * 0.28;
      this.a   = 0.75 + Math.random() * 0.2;
      this.ok  = true;
    }
    step() {
      this.x += Math.cos(this.ang) * this.spd;
      this.y += Math.sin(this.ang) * this.spd;
      this.a -= 0.011;
      if (this.a <= 0 || this.y > H) this.ok = false;
    }
    draw() {
      const tx = this.x - Math.cos(this.ang) * this.len;
      const ty = this.y - Math.sin(this.ang) * this.len;
      ctx.save();
      ctx.globalAlpha = this.a;
      const g = ctx.createLinearGradient(tx, ty, this.x, this.y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(167,139,250,1)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(this.x, this.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(this.x, this.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,190,255,1)';
      ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(167,139,250,1)';
      ctx.fill();
      ctx.restore();
    }
  }

  function init() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    pts    = Array.from({ length: N }, (_, i) => new Dot(true));
    meteors = [];
  }

  function draw(ts) {
    animId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);

    if (ts > nextMeteorAt) {
      meteors.push(new Meteor());
      nextMeteorAt = ts + 5000 + Math.random() * 9000;
    }
    meteors = meteors.filter(m => m.ok);

    ctx.save();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth   = 0.55;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          ctx.globalAlpha = (1 - d / LINK_DIST) * 0.13;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    pts.forEach(p => { p.step(); p.draw(); });
    meteors.forEach(m => { m.step(); m.draw(); });
  }

  function start() {
    cancelAnimationFrame(animId);
    init();
    animId = requestAnimationFrame(draw);
  }

  start();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(start, 200); });

  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    heroEl.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      const cx = mx / W - 0.5;
      const cy = my / H - 0.5;
      const g1 = document.querySelector('.glow-1');
      const g2 = document.querySelector('.glow-2');
      if (g1) { g1.style.marginLeft = (cx * 50) + 'px'; g1.style.marginTop = (cy * 38) + 'px'; }
      if (g2) { g2.style.marginLeft = (cx * -32) + 'px'; g2.style.marginTop = (cy * -24) + 'px'; }
    });
    heroEl.addEventListener('mouseleave', () => {
      mx = my = -9999;
      const g1 = document.querySelector('.glow-1');
      const g2 = document.querySelector('.glow-2');
      if (g1) { g1.style.marginLeft = ''; g1.style.marginTop = ''; }
      if (g2) { g2.style.marginLeft = ''; g2.style.marginTop = ''; }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animId); animId = null; }
    else if (!animId) animId = requestAnimationFrame(draw);
  });
})();
