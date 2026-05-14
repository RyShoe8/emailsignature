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
  officePhone: '833-779-3744',
};

const origin = 'http://localhost:3000';

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
  'standard: generic logo must not use SBD-only measured height'
);

const htmlStandardSbd = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    logoUrl: 'https://seniorbydesign.com/email-assets/sbd-logo.png',
  },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.match(
  htmlStandardSbd,
  /height="134"/,
  'standard: canonical SBD static asset keeps explicit height for email clients'
);
assert.doesNotMatch(
  htmlStandardSbd,
  /height:auto/,
  'standard: SBD static logo avoids height:auto so Gmail keeps proportion'
);
assert.match(
  htmlStandard,
  /src="https:\/\/seniorbydesign\.com\/email-assets\/icon-linkedin\.png"/,
  'standard: LinkedIn icon uses canonical /email-assets/ URL'
);
assert.match(
  htmlStandard,
  /src="https:\/\/seniorbydesign\.com\/email-assets\/icon-facebook\.png"/,
  'standard: Facebook icon uses canonical /email-assets/ URL'
);
assert.match(
  htmlStandard,
  /src="https:\/\/seniorbydesign\.com\/email-assets\/icon-instagram\.png"/,
  'standard: Instagram icon uses canonical /email-assets/ URL'
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

const htmlStackedSbd = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    logoUrl: 'https://seniorbydesign.com/email-assets/sbd-logo.png',
  },
  template: mockSignatureTemplate('stacked'),
  publicSiteOrigin: origin,
});
assert.match(htmlStackedSbd, /height="134"/, 'stacked: canonical SBD asset keeps explicit height');
assert.doesNotMatch(htmlStackedSbd, /height:auto/, 'stacked: SBD static logo avoids height:auto');

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
