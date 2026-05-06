import DOMPurify from 'isomorphic-dompurify';

DOMPurify.addHook('afterSanitizeAttributes', (node: any) => {
  // Force rel="noopener noreferrer" on all links with target="_blank"
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
  // Block external img src (pixel tracking / data exfiltration)
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') || '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
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
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
  });
}
