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

// Discord support: when a Discord URL is supplied, the icon row should include the
// Discord asset and the brand href.
const htmlDiscord = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    socialLinks: { ...mockSignatureBrand.socialLinks, discord: 'https://discord.gg/example' },
  },
  template: mockSignatureTemplate('standard'),
  publicSiteOrigin: origin,
});
assert.ok(
  htmlDiscord.includes(`${iconBase}icon-discord.png?v=1`),
  'standard: Discord icon resolves to publicSiteOrigin /email-assets/ with cache-bust query'
);
assert.match(
  htmlDiscord,
  /href="https:\/\/discord\.gg\/example[^"]*"/,
  'standard: Discord URL renders inside the social row'
);
// When no Discord URL is provided, the Discord <td> should not appear.
assert.doesNotMatch(
  htmlStandard,
  /icon-discord\.png/,
  'standard: Discord cell is omitted when no Discord URL is provided'
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
          { url: 'https://news.example.com/no-title' },
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
  htmlListImage.includes('news.example.com'),
  'corporate/list: URL-only row uses hostname as link label'
);
assert.match(
  htmlListImage,
  /href="https:\/\/news\.example\.com\/no-title[^"]*"/,
  'corporate/list: URL-only row still links to full URL'
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

assert.ok(
  htmlListImage.includes('max-device-width'),
  'corporate: responsive CSS includes max-device-width for mobile stacking'
);
assert.ok(
  htmlListImage.includes('sig-corp-blocks-stack') && htmlListImage.includes('padding-left:26px'),
  'corporate: blocks column has extra padding beside vertical divider'
);
assert.match(
  htmlListImage,
  /table\.sig-(?:root-layout-table|corp-header-layout-table)[\s\S]*?table-layout:\s*auto\s*!important/,
  'corporate: mobile CSS switches layout tables to table-layout auto'
);
assert.ok(
  htmlListImage.includes('class="sig-root-layout-table"') &&
    htmlListImage.includes('class="sig-corp-header-layout-table"'),
  'corporate: root and header tables carry layout class names'
);
assert.match(
  htmlListImage,
  /td\.sig-corp-main-stack\s*\{[\s\S]*?padding-left:\s*14px\s*!important[\s\S]*?padding-right:\s*14px\s*!important/,
  'corporate: mobile stack restores symmetric horizontal inset on main column'
);

// Corporate template should not show redundant Phone/Email/Web labels — the values
// already look like phone numbers / emails / URLs. Mobile keeps its label so it can
// be distinguished from the main office number when both are set.
const htmlCorporateWithMobile = renderSignature({
  profile: { ...profile, mobilePhone: '555-0200' },
  brand: mockSignatureBrand,
  template: corporateTemplate,
  publicSiteOrigin: origin,
});
const corporateContactRowRe = /<table[^>]*font-size:13px;[^"]*"[\s\S]*?<\/table>/;
const contactBlock = htmlCorporateWithMobile.match(corporateContactRowRe)?.[0] ?? '';
assert.ok(contactBlock.length > 0, 'corporate: contact table is present in rendered output');
assert.doesNotMatch(contactBlock, /Phone</i, 'corporate: removes "Phone" label');
assert.doesNotMatch(contactBlock, />Email</i, 'corporate: removes "Email" label');
assert.doesNotMatch(contactBlock, />Web</i, 'corporate: removes "Web" label');
assert.match(contactBlock, /Mobile/i, 'corporate: keeps "Mobile" label to differentiate from main phone');

// Website should display without the https:// prefix in the body, but href stays fully qualified.
const htmlCorporateWebsite = renderSignature({
  profile,
  brand: { ...mockSignatureBrand, website: 'www.example.com' },
  template: corporateTemplate,
  publicSiteOrigin: origin,
});
assert.match(
  htmlCorporateWebsite,
  /href="https:\/\/www\.example\.com"[^>]*>\s*www\.example\.com\s*</,
  'corporate: website displays prefix-less but href keeps https://'
);
assert.doesNotMatch(
  htmlCorporateWebsite,
  />\s*https:\/\/www\.example\.com\s*</,
  'corporate: website body should not include https:// prefix'
);
assert.match(
  htmlListImage,
  /sig-corp-blocks-stack[\s\S]*Recent Wins/,
  'corporate: content blocks render in header side column on desktop'
);
assert.doesNotMatch(
  htmlListImage,
  /<td[^>]*width="220"[^>]*>\s*<table[^>]*>[\s\S]*?Recent Wins/,
  'corporate: blocks must not render in the old 220px right column'
);

// Minimal (standard layout) should render content blocks in the desktop side column.
const minimalTemplate: import('../src/core/types').SignatureTemplate = {
  id: 'minimal-smoke',
  name: 'Minimal',
  layout: 'standard',
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

const htmlMinimalBlocks = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Resources',
        listItems: [{ title: 'Docs', url: 'https://example.com/docs' }],
      },
    ],
  },
  template: minimalTemplate,
  publicSiteOrigin: origin,
});
assert.ok(
  htmlMinimalBlocks.includes('Resources') && htmlMinimalBlocks.includes('Docs'),
  'minimal: list block renders beside the signature body'
);
assert.match(
  htmlMinimalBlocks,
  /sig-blocks-stack[\s\S]*Resources/,
  'minimal: blocks live in the side column cell'
);
assert.match(
  htmlMinimalBlocks,
  /colspan="3"/,
  'minimal: divider/address span all columns when blocks column is present'
);
assert.doesNotMatch(
  htmlMinimalBlocks,
  /<tr>\s*<td colspan="2"[^>]*>\s*<table[^>]*>[\s\S]*?Resources/,
  'minimal: blocks must not sit in a dedicated bottom colspan="2" row'
);
assert.ok(
  htmlMinimalBlocks.includes('max-device-width'),
  'minimal: standard layout includes max-device-width stack rules'
);
assert.ok(
  htmlMinimalBlocks.includes('padding-left:28px') && htmlMinimalBlocks.includes('sig-blocks-stack'),
  'minimal: blocks column has extra padding beside vertical divider'
);
assert.ok(
  htmlMinimalBlocks.includes('class="sig-root-layout-table"'),
  'minimal: root layout table has class for fluid mobile layout'
);
assert.match(
  htmlMinimalBlocks,
  /table\.sig-root-layout-table\s*\{[\s\S]*?table-layout:\s*auto\s*!important/,
  'minimal: mobile CSS switches root table to table-layout auto'
);
assert.match(
  htmlMinimalBlocks,
  /td\.sig-main-stack\s*\{[\s\S]*?padding-left:\s*14px\s*!important[\s\S]*?padding-right:\s*14px\s*!important/,
  'minimal: mobile stack restores symmetric horizontal inset on main column'
);

// Stacked template should also support blocks.
const stackedTemplate: import('../src/core/types').SignatureTemplate = {
  id: 'stacked-smoke',
  name: 'Stacked',
  layout: 'stacked',
  elements: [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'contentBlocks' },
  ],
};
const htmlStackedBlocks = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'image',
        enabled: true,
        imageUrl: 'https://example.com/images/stacked.png',
      },
    ],
  },
  template: stackedTemplate,
  publicSiteOrigin: origin,
});
assert.match(
  htmlStackedBlocks,
  /src="https:\/\/example\.com\/images\/stacked\.png[^"]*"/,
  'stacked: image block renders inside the new bottom row'
);

// Legacy custom block still renders for back-compat reads — but without "Learn more".
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
        customUrl: 'https://example.com/legacy',
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
assert.doesNotMatch(
  htmlLegacyCustom,
  /Learn more/i,
  'corporate/custom: legacy custom block no longer emits a "Learn more" row'
);
assert.match(
  htmlLegacyCustom,
  /<a href="https:\/\/example\.com\/legacy[^"]*"[^>]*>Legacy<\/a>/,
  'corporate/custom: title itself is the link when URL is set and no image'
);

process.stdout.write('email-client-smoke: all checks passed.\n');
