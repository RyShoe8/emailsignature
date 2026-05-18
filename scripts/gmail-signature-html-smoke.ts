/**
 * Smoke tests for Gmail signature HTML preparation (10k character limit).
 */
import assert from 'node:assert/strict';
import { renderSignature, mockSignatureBrand, type SignatureTemplate } from 'emailsignature-engine';
import {
  GMAIL_SIGNATURE_MAX_CHARS,
  prepareSignatureHtmlForGmail,
  assertGmailSignatureWithinLimit,
  removeSignatureElementsByClass,
} from '../lib/email/gmailSignatureHtml';
import { appendSignatureClickTracking } from '../lib/signatureTrackingHtml';

const corporateTemplate: SignatureTemplate = {
  id: 'corp-gmail-smoke',
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

const profile = {
  firstName: 'Ryan',
  lastName: 'Schumacher',
  title: 'Director',
  email: 'ryan@example.com',
  officePhone: '555-0100',
  mobilePhone: '',
};

const raw = renderSignature({
  profile,
  brand: {
    ...mockSignatureBrand,
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Recent Wins',
        listItems: [
          { title: 'Quarterly Report', url: 'https://example.com/q4' },
          { title: 'New Feature', url: 'https://example.com/feature' },
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
  publicSiteOrigin: 'https://tailnote.example',
});

const withStyle = `<style type="text/css">@media (max-width:600px){ tr.x { display:none; } }</style>
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />
<table><tr class="sig-blocks-stacked-row"><td>fixture stacked row</td></tr></table>`;

const corporateMinimalTemplate: SignatureTemplate = {
  ...corporateTemplate,
  elements: [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'divider' },
    { type: 'address' },
  ],
};

const rawMinimal = renderSignature({
  profile,
  brand: mockSignatureBrand,
  template: corporateMinimalTemplate,
  publicSiteOrigin: 'https://tailnote.example',
});

const fixture = withStyle + raw;

const preparedMinimal = prepareSignatureHtmlForGmail(rawMinimal);

assert.ok(/@media/i.test(preparedMinimal), 'keeps responsive @media CSS for Gmail when under size limit');
assert.ok(!/<link\b/i.test(preparedMinimal), 'strips link tags');
assert.doesNotMatch(
  preparedMinimal,
  /<tr class="sig-blocks-stacked-row"/,
  'minimal corporate has no stacked promo row in markup'
);

const prepared = prepareSignatureHtmlForGmail(fixture);

assert.ok(!/<link\b/i.test(prepared), 'strips link tags on full fixture');
assert.ok(prepared.includes('Recent Wins'), 'keeps promo content');
assert.ok(/sig-blocks-stacked-row/i.test(prepared), 'full fixture keeps stacked promo row');
assert.ok(/sig-blocks-desktop/i.test(prepared), 'full fixture keeps desktop side-column');
assert.ok(
  /bgcolor="#e5e5e5"[^>]*height:1px/.test(prepared),
  'corporate divider uses solid grey rule visible in Gmail'
);

// Regression: depth-aware removal helper (used in 10k fallback)
const nestedTrFixture = `<table><tr class="sig-blocks-stacked-row"><td colspan="3"><table><tr><td>inner</td></tr><tr><td>Recent Wins</td></tr></table></td></tr></table>
<table><tr><td class="sig-blocks-desktop sig-corp-blocks-stack"><table><tr><td>desktop only</td></tr></table></td></tr></table>`;
const nestedPrepared = removeSignatureElementsByClass(nestedTrFixture, 'sig-blocks-stacked-row', 'tr');
assert.ok(nestedPrepared.includes('desktop only'), 'helper: removing stacked row leaves desktop column');
assert.ok(!nestedPrepared.includes('sig-blocks-stacked-row'), 'helper: stacked row removed');

const tdRemoved = removeSignatureElementsByClass(
  '<table><tr><td class="sig-blocks-desktop"><table><tr><td>a</td></tr></table></td><td>keep</td></tr></table>',
  'sig-blocks-desktop',
  'td'
);
assert.ok(!tdRemoved.includes('sig-blocks-desktop'), 'helper removes nested desktop td');
assert.ok(tdRemoved.includes('keep'), 'helper preserves sibling cells');

const preparedLen = prepared.length;
assert.ok(
  preparedLen < GMAIL_SIGNATURE_MAX_CHARS,
  `corporate fixture should be under Gmail limit after prepare (got ${preparedLen})`
);

assert.doesNotThrow(() => assertGmailSignatureWithinLimit(fixture), 'typical corporate passes limit check');

// Tracked links survive Gmail prep when under limit
process.env.BETTER_AUTH_SECRET = 'smoke-test-secret-key-minimum-length-32';
const tracked = appendSignatureClickTracking({
  html: raw,
  organizationId: '507f1f77bcf86cd799439011',
  employeeId: '507f1f77bcf86cd799439012',
  input: {
    profile,
    brand: { ...mockSignatureBrand, contentBlocks: [] },
    template: corporateTemplate,
    publicSiteOrigin: 'https://tailnote.example',
  },
  baseUrl: 'https://tailnote.example',
});
const trackedPrepared = prepareSignatureHtmlForGmail(tracked);
assert.ok(
  trackedPrepared.includes('/api/track/signature?t='),
  'Gmail prep keeps tracked redirect URLs when under size limit'
);

const huge = '<div>' + 'x'.repeat(GMAIL_SIGNATURE_MAX_CHARS + 1) + '</div>';
assert.throws(
  () => assertGmailSignatureWithinLimit(huge),
  /after Gmail preparation/,
  'over-limit throws clear error'
);

console.log('gmail-signature-html-smoke: all checks passed.');
