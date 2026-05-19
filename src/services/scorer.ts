import type { ScrapedPage, BrandScore, BrandIssue } from '../types';

const IMPACT_NUMBER = /\d+[%+xX]|\$[\d,]+|\d{2,}[+]?\s*(users|customers|clients|projects|downloads|stars|followers|subscribers|views|revenue|growth)/i;
const ACTION_VERBS = /\b(built|designed|led|launched|created|developed|architected|scaled|improved|increased|reduced|optimized|delivered|managed|shipped|automated|grew|transformed|achieved|generated)\b/i;
const TASK_WORDS = /\b(responsible for|worked on|helped with|assisted|participated|involved in|duties include)\b/i;
const CREDIBILITY_KEYWORDS = /\b(certified|award|recognized|featured in|published|speaker|contributor|open.?source|patent)\b/i;

export function scorePortfolio(page: ScrapedPage): { scores: BrandScore; issues: BrandIssue[] } {
  const issues: BrandIssue[] = [];

  const clarity = scoreClarity(page, issues);
  const impact = scoreImpact(page, issues);
  const credibility = scoreCredibility(page, issues);
  const attention = scoreAttention(page, issues);
  const actionability = scoreActionability(page, issues);

  const overall = Math.round((clarity + impact + credibility + attention + actionability) / 5);

  return {
    scores: { clarity, impact, credibility, attention, actionability, overall },
    issues,
  };
}

const HERO_SELECTOR = 'header, [class*="hero"], [class*="banner"], [class*="jumbotron"], main > section:first-child, main > div:first-child';
const FOOTER_SELECTOR = 'footer, [class*="footer"], [class*="contact"], body > div:last-child, body > section:last-child';
const NAV_SELECTOR = 'nav, [class*="nav"], header, [role="navigation"]';

function scoreClarity(page: ScrapedPage, issues: BrandIssue[]): number {
  let score = 0;

  const h1s = page.headings.filter(h => h.level === 1);
  if (h1s.length >= 1) {
    score += 25;
  } else {
    issues.push({ dimension: 'clarity', severity: 'error', message: 'No H1 heading found — visitors can\'t identify who you are at a glance', selector: HERO_SELECTOR, section: 'header' });
  }

  if (page.title && page.title.length > 5) {
    score += 15;
  } else {
    issues.push({ dimension: 'clarity', severity: 'warning', message: 'Page title is missing or too short — it should include your name and role', selector: 'title, head', section: 'meta' });
  }

  if (page.metaDescription && page.metaDescription.length > 20) {
    score += 10;
  } else {
    issues.push({ dimension: 'clarity', severity: 'info', message: 'Meta description is missing — add one for SEO and link previews', selector: 'head', section: 'meta' });
  }

  const firstSections = page.textSections.slice(0, 5);
  const rolePattern = /\b(developer|designer|engineer|architect|consultant|freelancer|founder|creator|writer|marketer|analyst|scientist|manager|lead|speaker|motivational speaker|coach|trainer|educator|entrepreneur|author|blogger|photographer|therapist|counselor|advisor|professor|teacher|artist|illustrator|journalist|editor|strategist|recruiter|researcher|product manager|ux|ui|fullstack|frontend|backend|devops)\b/i;
  const hasRoleDescription = firstSections.some(s => rolePattern.test(s.text))
    || page.headings.slice(0, 3).some(h => rolePattern.test(h.text))
    || (page.title && rolePattern.test(page.title));
  if (hasRoleDescription) {
    score += 25;
  } else {
    issues.push({ dimension: 'clarity', severity: 'error', message: 'No clear role/title found in the first sections — visitors should know what you do within 5 seconds', selector: HERO_SELECTOR, section: 'hero' });
  }

  const bioSection = page.textSections.find(s => s.text.length > 50 && s.text.length < 500);
  if (bioSection) {
    score += 15;
  } else if (page.textSections.some(s => s.text.length > 500)) {
    score += 5;
    issues.push({ dimension: 'clarity', severity: 'warning', message: 'Bio section is too long — keep it under 2-3 sentences for quick scanning', selector: '[class*="about"], [class*="bio"], [id*="about"], main > section, main > div', section: 'about' });
  } else {
    issues.push({ dimension: 'clarity', severity: 'warning', message: 'No clear bio/about section found', selector: HERO_SELECTOR, section: 'hero' });
  }

  if (h1s.length > 1) {
    score -= 5;
    issues.push({ dimension: 'clarity', severity: 'warning', message: `Multiple H1 headings found (${h1s.length}) — use only one for clear identity`, selector: 'h1', section: 'headings' });
  }

  const uniqueHeadingTexts = new Set(page.headings.map(h => h.text.toLowerCase()));
  if (uniqueHeadingTexts.size >= 3) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreImpact(page: ScrapedPage, issues: BrandIssue[]): number {
  let score = 0;
  const allText = page.textSections.map(s => s.text).join(' ');

  const numberMatches = allText.match(new RegExp(IMPACT_NUMBER.source, 'gi')) || [];
  if (numberMatches.length >= 3) {
    score += 35;
  } else if (numberMatches.length >= 1) {
    score += 20;
    issues.push({ dimension: 'impact', severity: 'warning', message: 'Only a few quantified achievements found — add more numbers to show impact (e.g., "grew revenue 40%")', selector: '[class*="project"], [class*="work"], [class*="experience"], [class*="portfolio"], main section, main > div', section: 'projects' });
  } else {
    issues.push({ dimension: 'impact', severity: 'error', message: 'No quantified achievements found — show impact with numbers (users, revenue, %, etc.)', selector: '[class*="project"], [class*="work"], [class*="experience"], [class*="portfolio"], main section, main > div', section: 'projects' });
  }

  const actionVerbMatches = allText.match(new RegExp(ACTION_VERBS.source, 'gi')) || [];
  if (actionVerbMatches.length >= 5) {
    score += 25;
  } else if (actionVerbMatches.length >= 2) {
    score += 15;
    issues.push({ dimension: 'impact', severity: 'info', message: 'Use more action verbs (built, launched, scaled, etc.) to convey ownership', selector: 'p, li', section: 'content' });
  } else {
    issues.push({ dimension: 'impact', severity: 'warning', message: 'Few action verbs found — your copy reads passive. Lead with what you achieved.', selector: 'p, li', section: 'content' });
  }

  const taskMatches = allText.match(new RegExp(TASK_WORDS.source, 'gi')) || [];
  if (taskMatches.length >= 3) {
    score -= 10;
    issues.push({ dimension: 'impact', severity: 'warning', message: 'Too many task-oriented phrases ("responsible for", "worked on") — reframe as outcomes', selector: 'p, li', section: 'content' });
  } else if (taskMatches.length === 0) {
    score += 15;
  } else {
    score += 5;
  }

  const projectHeadings = page.headings.filter(h =>
    /\b(project|work|portfolio|case.?stud|experience)\b/i.test(h.text)
  );
  if (projectHeadings.length >= 1) {
    score += 15;
  } else {
    issues.push({ dimension: 'impact', severity: 'info', message: 'No clear projects/portfolio section found — showcase your best work', selector: 'main, [class*="content"], body > div', section: 'projects' });
  }

  const externalProjectLinks = page.links.filter(l => l.isExternal && !l.href.includes('linkedin') && !l.href.includes('twitter'));
  if (externalProjectLinks.length >= 3) {
    score += 10;
  } else if (externalProjectLinks.length >= 1) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreCredibility(page: ScrapedPage, issues: BrandIssue[]): number {
  let score = 0;

  if (page.socialLinks.length >= 3) {
    score += 25;
  } else if (page.socialLinks.length >= 1) {
    score += 15;
    issues.push({ dimension: 'credibility', severity: 'info', message: `Only ${page.socialLinks.length} social link(s) found — add more for cross-platform credibility`, selector: NAV_SELECTOR + ', ' + FOOTER_SELECTOR, section: 'social' });
  } else {
    issues.push({ dimension: 'credibility', severity: 'error', message: 'No social/professional links found — add GitHub, LinkedIn, etc. to establish credibility', selector: NAV_SELECTOR + ', ' + FOOTER_SELECTOR, section: 'social' });
  }

  if (page.hasTestimonials) {
    score += 25;
    if (page.testimonialCount >= 3) score += 5;
  } else {
    issues.push({ dimension: 'credibility', severity: 'warning', message: 'No testimonials or endorsements found — social proof significantly boosts credibility', selector: 'main, [class*="content"], body', section: 'testimonials' });
  }

  const allText = page.rawText;
  if (CREDIBILITY_KEYWORDS.test(allText)) {
    score += 20;
  } else {
    issues.push({ dimension: 'credibility', severity: 'info', message: 'No certifications, awards, or publications mentioned — highlight any credentials', selector: '[class*="about"], [class*="skill"], [class*="credential"], main section', section: 'credentials' });
  }

  const githubLink = page.socialLinks.find(l => l.includes('github.com'));
  if (githubLink) {
    score += 15;
  }

  const linkedinLink = page.socialLinks.find(l => l.includes('linkedin.com'));
  if (linkedinLink) {
    score += 10;
  }

  const hasProfileImage = page.images.some(img =>
    /\b(profile|avatar|headshot|photo|portrait|me)\b/i.test(img.alt + ' ' + img.src)
  );
  if (hasProfileImage) {
    score += 10;
  } else if (page.images.length > 0) {
    score += 5;
    issues.push({ dimension: 'credibility', severity: 'info', message: 'No clear profile photo detected — a professional photo increases trust', selector: 'img, ' + HERO_SELECTOR, section: 'hero' });
  } else {
    issues.push({ dimension: 'credibility', severity: 'warning', message: 'No images found on the page — add a professional photo', selector: HERO_SELECTOR, section: 'hero' });
  }

  return Math.max(0, Math.min(100, score));
}

function scoreAttention(page: ScrapedPage, issues: BrandIssue[]): number {
  let score = 0;

  if (page.hasHeroSection) {
    score += 25;
  } else {
    issues.push({ dimension: 'attention', severity: 'warning', message: 'No hero/banner section detected — a strong visual opening captures attention', selector: 'body > header, body > div:first-child, body > section:first-child, main > *:first-child', section: 'hero' });
  }

  const headingLevels = new Set(page.headings.map(h => h.level));
  if (headingLevels.size >= 3) {
    score += 20;
  } else if (headingLevels.size >= 2) {
    score += 10;
    issues.push({ dimension: 'attention', severity: 'info', message: 'Limited heading hierarchy — use H1-H3 to create clear visual structure', selector: 'h1, h2, h3', section: 'headings' });
  } else {
    issues.push({ dimension: 'attention', severity: 'warning', message: 'Poor heading hierarchy — content lacks visual structure for scanning', selector: 'h1, h2, h3, main, body > div', section: 'headings' });
  }

  if (page.images.length >= 3) {
    score += 15;
  } else if (page.images.length >= 1) {
    score += 8;
    issues.push({ dimension: 'attention', severity: 'info', message: 'Few images — consider adding project screenshots, diagrams, or visuals', selector: 'img', section: 'images' });
  } else {
    issues.push({ dimension: 'attention', severity: 'warning', message: 'No images found — visuals are critical for engagement', selector: HERO_SELECTOR, section: 'hero' });
  }

  if (page.hasCTA) {
    score += 20;
  } else {
    issues.push({ dimension: 'attention', severity: 'error', message: 'No call-to-action found above the fold — add a clear CTA like "Hire Me" or "Get in Touch"', selector: HERO_SELECTOR, section: 'hero' });
  }

  if (page.wordCount >= 200 && page.wordCount <= 2000) {
    score += 10;
  } else if (page.wordCount < 200) {
    score += 3;
    issues.push({ dimension: 'attention', severity: 'warning', message: `Page has only ${page.wordCount} words — too thin. Add more substance.`, selector: 'main, body', section: 'content' });
  } else {
    score += 5;
    issues.push({ dimension: 'attention', severity: 'info', message: `Page has ${page.wordCount} words — consider trimming for scannability`, selector: 'main, body', section: 'content' });
  }

  if (page.title && page.title.length <= 60 && page.title.length >= 10) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreActionability(page: ScrapedPage, issues: BrandIssue[]): number {
  let score = 0;

  if (page.hasContactInfo) {
    score += 25;
  } else {
    issues.push({ dimension: 'actionability', severity: 'error', message: 'No contact information found — visitors have no way to reach you', selector: FOOTER_SELECTOR, section: 'footer' });
  }

  if (page.contactMethods.length >= 2) {
    score += 10;
  } else if (page.contactMethods.length === 1) {
    score += 5;
    issues.push({ dimension: 'actionability', severity: 'info', message: 'Only one contact method detected — consider adding email, phone, or a contact form alongside social links', selector: FOOTER_SELECTOR + ', a[href^="mailto:"]', section: 'footer' });
  }

  if (page.ctaTexts.length >= 2) {
    score += 25;
  } else if (page.ctaTexts.length === 1) {
    score += 15;
    issues.push({ dimension: 'actionability', severity: 'info', message: 'Only one CTA found — consider adding CTAs in different sections', selector: 'a, button, [role="button"]', section: 'cta' });
  } else {
    issues.push({ dimension: 'actionability', severity: 'error', message: 'No CTA buttons/links found — add clear calls-to-action', selector: HERO_SELECTOR + ', ' + FOOTER_SELECTOR, section: 'cta' });
  }

  const navLinks = page.links.filter(l => !l.isExternal && l.text.length < 30);
  if (navLinks.length >= 3) {
    score += 15;
  } else {
    issues.push({ dimension: 'actionability', severity: 'info', message: 'Few internal navigation links — make it easy to explore your site', selector: NAV_SELECTOR, section: 'navigation' });
  }

  if (page.socialLinks.length >= 2) {
    score += 15;
  }

  const hasResumeLink = page.links.some(l =>
    /\b(resume|cv|download)\b/i.test(l.text + ' ' + l.href)
  );
  if (hasResumeLink) {
    score += 10;
  } else {
    issues.push({ dimension: 'actionability', severity: 'info', message: 'No resume/CV download link found — make it easy to get your credentials', selector: NAV_SELECTOR + ', ' + HERO_SELECTOR, section: 'navigation' });
  }

  return Math.max(0, Math.min(100, score));
}
