import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapedPage } from '../types';

const SOCIAL_DOMAINS = [
  'github.com', 'linkedin.com', 'twitter.com', 'x.com',
  'dribbble.com', 'behance.net', 'medium.com', 'dev.to',
  'stackoverflow.com', 'youtube.com', 'instagram.com',
];

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const BLOCKED_STATUS_CODES = new Set([999, 403, 429, 503]);

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|::1)/i;

function assertPublicUrl(url: string): void {
  const { hostname } = new URL(url);
  if (PRIVATE_HOST.test(hostname)) {
    throw new Error(`Requests to private or loopback addresses are not allowed`);
  }
}

export class ScrapeBlockedError extends Error {
  constructor(public statusCode: number, public hostname: string) {
    super(`${hostname} returned status ${statusCode} — this site blocks automated access`);
    this.name = 'ScrapeBlockedError';
  }
}

const CTA_PATTERNS = /\b(hire me|contact|get in touch|let'?s talk|book a call|schedule|reach out|download resume|work with me|connect)\b/i;
const CONTACT_PATTERNS = /(\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z]{2,}\b|tel:|phone:|mailto:)/i;
const TESTIMONIAL_PATTERNS = /\b(testimonial|review|what .* said|client feedback|endorsement|recommendation)\b/i;
const IMPACT_NUMBER_PATTERN = /\d+[%+xX]|\$[\d,]+|\d{2,}[+]?\s*(users|customers|clients|projects|downloads|stars|followers|subscribers|views)/i;

export async function scrapePage(url: string): Promise<ScrapedPage> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  assertPublicUrl(normalizedUrl);
  const hostname = new URL(normalizedUrl).hostname;

  let html: string;
  try {
    const resp = await axios.get(normalizedUrl, {
      timeout: 15000,
      headers: BROWSER_HEADERS,
      maxRedirects: 5,
      validateStatus: (status) => status < 500 || BLOCKED_STATUS_CODES.has(status),
    });

    if (BLOCKED_STATUS_CODES.has(resp.status)) {
      throw new ScrapeBlockedError(resp.status, hostname);
    }

    html = resp.data;
  } catch (err) {
    if (err instanceof ScrapeBlockedError) throw err;
    if (axios.isAxiosError(err) && err.response && BLOCKED_STATUS_CODES.has(err.response.status)) {
      throw new ScrapeBlockedError(err.response.status, hostname);
    }
    throw err;
  }

  return extractPage(html, normalizedUrl);
}

function extractPage(html: string, normalizedUrl: string): ScrapedPage {
  const $ = cheerio.load(html);

  $('script, style, noscript').remove();

  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';

  const headings: ScrapedPage['headings'] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    headings.push({
      level: parseInt(el.tagName[1]),
      text: $(el).text().trim(),
    });
  });

  const links: ScrapedPage['links'] = [];
  const socialLinks: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    const isExternal = href.startsWith('http') && !href.includes(new URL(normalizedUrl).hostname);
    links.push({ href, text, isExternal });
    if (SOCIAL_DOMAINS.some(d => href.includes(d))) {
      socialLinks.push(href);
    }
  });

  const images: ScrapedPage['images'] = [];
  $('img').each((_, el) => {
    images.push({
      src: $(el).attr('src') || '',
      alt: $(el).attr('alt') || '',
    });
  });

  const textSections: ScrapedPage['textSections'] = [];
  let sectionIndex = 0;
  $('p, li, blockquote, figcaption, [class*="bio"], [class*="about"], [class*="intro"], [class*="hero"], [class*="summary"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10) {
      textSections.push({
        tag: el.tagName,
        text,
        selector: `${el.tagName}:nth-of-type(${++sectionIndex})`,
      });
    }
  });

  const bodyText = $('body').text();

  const ctaTexts: string[] = [];
  $('a, button, [role="button"]').each((_, el) => {
    const text = $(el).text().trim();
    if (CTA_PATTERNS.test(text)) {
      ctaTexts.push(text);
    }
  });

  const hasContactInfo = CONTACT_PATTERNS.test(bodyText) || $('a[href^="mailto:"]').length > 0;
  const contactMethods: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => { contactMethods.push('email'); });
  $('a[href^="tel:"]').each((_, el) => { contactMethods.push('phone'); });
  if ($('form, [class*="contact-form"], [id*="contact-form"], [class*="wpcf7"], input[type="email"]').length > 0) contactMethods.push('form');
  if ($('a[href*="wa.me"], a[href*="whatsapp"]').length > 0) contactMethods.push('whatsapp');
  if ($('a[href*="t.me"], a[href*="telegram"]').length > 0) contactMethods.push('telegram');
  if ($('a[href*="twitter.com"], a[href*="x.com"]').length > 0) contactMethods.push('twitter');
  if ($('a[href*="instagram.com"]').length > 0) contactMethods.push('instagram');
  if ($('a[href*="linkedin.com"]').length > 0) contactMethods.push('linkedin');
  if ($('a[href*="contact"]').length > 0 || $('a').filter((_, el) => /\bcontact\b/i.test($(el).text())).length > 0) contactMethods.push('contact-page');

  const testimonialSection = $('[class*="testimonial"], [class*="review"], [id*="testimonial"], [id*="review"], blockquote').length;
  const hasTestimonials = testimonialSection > 0 || TESTIMONIAL_PATTERNS.test(bodyText);

  const hasHeroSection = $('[class*="hero"], [class*="banner"], [class*="jumbotron"], header section, main > section:first-child').length > 0
    || (headings.length > 0 && headings[0].level === 1);

  const rawText = bodyText.replace(/\s+/g, ' ').trim();

  return {
    url: normalizedUrl,
    title,
    metaDescription,
    headings,
    links,
    images,
    socialLinks: [...new Set(socialLinks)],
    textSections,
    hasCTA: ctaTexts.length > 0,
    ctaTexts,
    hasContactInfo,
    contactMethods,
    hasTestimonials,
    testimonialCount: testimonialSection,
    hasHeroSection,
    wordCount: rawText.split(/\s+/).length,
    rawText: rawText.slice(0, 5000),
  };
}

export function parseHtml(html: string, url: string): ScrapedPage {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  return extractPage(html, normalizedUrl);
}
