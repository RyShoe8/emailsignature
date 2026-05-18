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

const fixture = withStyle + raw;

const prepared = prepareSignatureHtmlForGmail(fixture);

assert.ok(!/<style/i.test(prepared), 'strips style blocks');
assert.ok(!/<link\b/i.test(prepared), 'strips link tags');
assert.ok(/sig-blocks-stacked-row/i.test(prepared), 'keeps stacked promo row for Gmail');
assert.ok(!/sig-blocks-desktop/i.test(prepared), 'removes desktop side-column promo cells');
assert.ok(prepared.includes('Recent Wins'), 'keeps promo content from stacked row');
assert.strictEqual(
  (prepared.match(/Recent Wins/g) ?? []).length,
  1,
  'promo title appears once (no duplicate desktop + orphan fragments)'
);
assert.ok(
  /bgcolor="#e5e5e5"[^>]*height:1px/.test(prepared),
  'corporate divider uses solid grey rule visible in Gmail'
);

// Regression: depth-aware removal must not break on nested <tr> inside stacked cell
const nestedTrFixture = `<table><tr class="sig-blocks-stacked-row"><td colspan="3"><table><tr><td>inner</td></tr><tr><td>Recent Wins</td></tr></table></td></tr></table>
<table><tr><td class="sig-blocks-desktop sig-corp-blocks-stack"><table><tr><td>desktop only</td></tr></table></td></tr></table>`;
const nestedPrepared = prepareSignatureHtmlForGmail(nestedTrFixture);
assert.ok(/sig-blocks-stacked-row/i.test(nestedPrepared), 'nested tr: stacked row intact');
assert.ok(nestedPrepared.includes('Recent Wins'), 'nested tr: stacked promo content kept');
assert.ok(!nestedPrepared.includes('desktop only'), 'nested tr: desktop column removed');
assert.ok(!/sig-blocks-desktop/i.test(nestedPrepared), 'nested tr: no desktop class left');

// Unit: removeSignatureElementsByClass handles nested td
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

const huge = '<div>' + 'x'.repeat(GMAIL_SIGNATURE_MAX_CHARS + 1) + '</div>';
assert.throws(
  () => assertGmailSignatureWithinLimit(huge),
  /after Gmail preparation/,
  'over-limit throws clear error'
);

console.log('gmail-signature-html-smoke: all checks passed.');
