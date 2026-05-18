/**
 * Smoke tests for Gmail signature HTML preparation (10k character limit).
 */
import assert from 'node:assert/strict';
import { renderSignature, mockSignatureBrand, type SignatureTemplate } from 'emailsignature-engine';
import {
  GMAIL_SIGNATURE_MAX_CHARS,
  prepareSignatureHtmlForGmail,
  assertGmailSignatureWithinLimit,
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
<table><tr class="sig-blocks-stacked-row"><td>duplicate blocks</td></tr></table>`;

const fixture = withStyle + raw;

const prepared = prepareSignatureHtmlForGmail(fixture);

assert.ok(!/<style/i.test(prepared), 'strips style blocks');
assert.ok(!/<link\b/i.test(prepared), 'strips link tags');
assert.ok(!/sig-blocks-stacked-row/i.test(prepared), 'strips stacked promo rows');
assert.ok(prepared.includes('Recent Wins'), 'keeps promo content from desktop column');

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
