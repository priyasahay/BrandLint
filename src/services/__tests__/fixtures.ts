import type { ScrapedPage } from '../../types';

export function makePage(overrides: Partial<ScrapedPage> = {}): ScrapedPage {
  return {
    url: 'https://example.com',
    title: '',
    metaDescription: '',
    headings: [],
    links: [],
    images: [],
    socialLinks: [],
    textSections: [],
    hasCTA: false,
    ctaTexts: [],
    hasContactInfo: false,
    contactMethods: [],
    hasTestimonials: false,
    testimonialCount: 0,
    hasHeroSection: false,
    wordCount: 0,
    rawText: '',
    ...overrides,
  };
}

export function makeFullPage(): ScrapedPage {
  return makePage({
    title: 'Jane Doe — Senior Frontend Engineer',
    metaDescription: 'Frontend engineer specializing in React and TypeScript.',
    headings: [
      { level: 1, text: 'Jane Doe — Frontend Engineer' },
      { level: 2, text: 'Projects' },
      { level: 2, text: 'Experience' },
      { level: 3, text: 'About Me' },
    ],
    links: [
      { href: 'https://github.com/jane', text: 'GitHub', isExternal: true },
      { href: 'https://linkedin.com/in/jane', text: 'LinkedIn', isExternal: true },
      { href: '/projects', text: 'Projects', isExternal: false },
      { href: '/about', text: 'About', isExternal: false },
      { href: '/contact', text: 'Contact', isExternal: false },
      { href: '/resume.pdf', text: 'Download Resume', isExternal: false },
    ],
    images: [
      { src: '/profile.jpg', alt: 'profile photo of Jane' },
      { src: '/project1.png', alt: 'project screenshot' },
      { src: '/project2.png', alt: 'project screenshot 2' },
    ],
    socialLinks: ['https://github.com/jane', 'https://linkedin.com/in/jane', 'https://twitter.com/jane'],
    textSections: [
      { tag: 'p', text: 'I am a frontend engineer with 5 years of experience.', selector: 'p' },
      { tag: 'p', text: 'Built a platform serving 50,000 users, increased conversion by 30%, and reduced load time by 40%.', selector: 'p' },
      { tag: 'p', text: 'Launched and scaled three open-source libraries with over 2,000 GitHub stars.', selector: 'p' },
    ],
    hasCTA: true,
    ctaTexts: ['Hire Me', 'Get in Touch'],
    hasContactInfo: true,
    contactMethods: ['email', 'contact form'],
    hasTestimonials: true,
    testimonialCount: 4,
    hasHeroSection: true,
    wordCount: 500,
    rawText: 'certified award recognized open-source',
  });
}
