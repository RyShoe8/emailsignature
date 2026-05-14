/**
 * Automated structural checks for Gmail / Outlook / Apple Mail friendly markup.
 * Still paste-test in real clients after deploy (images load, compose quirks).
 */
import assert from 'node:assert/strict';
import { renderSignature } from '../src/index';
import { mockSignatureBrand, mockSignatureTemplate } from '../src/fixtures';

const profile = {
  firstName: 'Test',
  lastName: 'User',
  title: 'COO',
  email: 'test@example.com',
  officePhone: '555-0100',
};

const origin = 'https://app.example.com';

const htmlStandard = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});

assert.match(
  htmlStandard,
  /height:auto/,
  'standard: generic static logo uses height:auto so aspect ratio is preserved'
);
assert.doesNotMatch(
  htmlStandard,
  /height="134"/,
  'standard: generic logo must not use legacy fixed aspect height'
);
assert.ok(
  htmlStandard.includes('white-space:nowrap') && htmlStandard.includes('Office:'),
  'standard: Office/Mobile label column uses nowrap so values stay beside labels'
);

const iconBase = `${origin}/email-assets/`;
assert.ok(
  htmlStandard.includes(`${iconBase}icon-linkedin.png`),
  'standard: LinkedIn icon resolves to publicSiteOrigin /email-assets/'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-facebook.png`),
  'standard: Facebook icon resolves to publicSiteOrigin /email-assets/'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-instagram.png`),
  'standard: Instagram icon resolves to publicSiteOrigin /email-assets/'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-reddit.png`),
  'standard: Reddit icon resolves to publicSiteOrigin /email-assets/'
);
assert.doesNotMatch(
  htmlStandard,
  /src="[^"]*\?v=/i,
  'standard: no ?v= cache-busting query strings on signature image URLs (immutable Cache-Control handles freshness)'
);
assert.doesNotMatch(htmlStandard, /\/api\/image-proxy/i, 'standard: no image proxy URLs in img src');
assert.doesNotMatch(htmlStandard, /src="http:\/\//i, 'standard: no non-HTTPS image URLs');
assert.ok(
  htmlStandard.includes('border-collapse:collapse;margin-top:10px'),
  'standard: social row uses nested table'
);
assert.ok(
  htmlStandard.includes('bgcolor="#e5e5e5"') && htmlStandard.includes('height="1"'),
  'standard: divider uses 1px td (Gmail-safe)'
);

const htmlExplicit = renderSignature({
  profile,
  brand: { ...mockSignatureBrand, logoHeightPx: 72 },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.match(htmlExplicit, /height="72"/, 'standard: explicit logoHeightPx in img attributes');

const htmlStacked = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: mockSignatureTemplate('stacked'),
  publicSiteOrigin: origin,
});
assert.match(htmlStacked, /height:auto/, 'stacked: generic static logo uses height:auto');

const htmlAnimatedLogo = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    logoHeightPx: undefined,
    animation: { enabled: true, gifUrl: 'https://example.com/images/sample.gif' },
  },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.match(
  htmlAnimatedLogo,
  /height:auto/,
  'standard: animated GIF logo without logoHeightPx still uses height:auto'
);

process.stdout.write('email-client-smoke: all checks passed.\n');
