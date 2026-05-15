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
  htmlStandard.includes(`${iconBase}icon-linkedin.png?v=2`),
  'standard: LinkedIn icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-facebook.png?v=2`),
  'standard: Facebook icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-instagram.png?v=2`),
  'standard: Instagram icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.ok(
  htmlStandard.includes(`${iconBase}icon-reddit.png?v=2`),
  'standard: Reddit icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
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

// Corporate template with List + Image content blocks
const corporateTemplate: import('../src/core/types').SignatureTemplate = {
  id: 'corporate-smoke',
  name: 'Corporate',
  layout: 'corporate',
  elements: [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ],
};

const htmlListImage = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Recent Wins',
        listItems: [
          { title: 'Quarterly Report', description: 'Q4 published', url: 'https://example.com/q4' },
          { title: 'New Feature', url: 'https://example.com/feature' },
          { title: 'Plain Item' },
        ],
      },
      {
        type: 'image',
        enabled: true,
        imageUrl: 'https://example.com/images/promo.png',
        imageLinkUrl: 'https://example.com/promo',
      },
    ],
  },
  template: corporateTemplate,
  publicSiteOrigin: origin,
});

assert.ok(
  htmlListImage.includes('Recent Wins') && htmlListImage.includes('Quarterly Report'),
  'corporate/list: title and item title render'
);
assert.ok(
  htmlListImage.includes('Q4 published'),
  'corporate/list: item description renders'
);
assert.match(
  htmlListImage,
  /href="https:\/\/example\.com\/q4[^"]*"/,
  'corporate/list: item URL renders as link'
);
assert.ok(
  htmlListImage.includes('Plain Item'),
  'corporate/list: item without URL renders as plain span'
);
assert.match(
  htmlListImage,
  /src="https:\/\/example\.com\/images\/promo\.png[^"]*"[^>]*width="200"/,
  'corporate/image: image renders with 200px width'
);
assert.match(
  htmlListImage,
  /href="https:\/\/example\.com\/promo[^"]*"[\s\S]*?<img[^>]*promo\.png/,
  'corporate/image: image is wrapped in anchor when link is set'
);

// Legacy custom block still renders for back-compat reads
const htmlLegacyCustom = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'custom',
        enabled: true,
        customTitle: 'Legacy',
        customText: 'Old data still works',
      },
    ],
  },
  template: corporateTemplate,
  publicSiteOrigin: origin,
});
assert.ok(
  htmlLegacyCustom.includes('Legacy') && htmlLegacyCustom.includes('Old data still works'),
  'corporate/custom: legacy custom block still renders'
);

process.stdout.write('email-client-smoke: all checks passed.\n');
