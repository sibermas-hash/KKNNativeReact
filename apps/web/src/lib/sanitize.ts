import DOMPurify from 'isomorphic-dompurify';

DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
  // Force rel="noopener noreferrer" on all links with target="_blank"
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
  // Whitelist href protocols — block javascript: and data: (FM-11)
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    if (href && !/^(https?:|mailto:|#|\/)/i.test(href)) {
      node.removeAttribute('href');
    }
  }
  // Block data: URI and external img src (FH-03 + pixel tracking)
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') || '';
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      node.removeAttribute('src');
    }
  }
});

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'code',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  });
}
