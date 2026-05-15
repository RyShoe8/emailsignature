/**
 * Verifies list block anchors still classify as content_block_* after appendUtmParams
 * (tracking map keys must match hrefs with utm_* stripped).
 */
process.env.BETTER_AUTH_SECRET = 'smoke-test-secret-key-minimum-length-32';

import assert from 'node:assert/strict';
import { renderSignature, type RenderSignatureInput, type SignatureTemplate } from 'emailsignature-engine';
import { appendSignatureClickTracking } from '../lib/signatureTrackingHtml';

const template: SignatureTemplate = {
  id: 'track-smoke',
  name: 'Track smoke',
  layout: 'standard',
  elements: [{ type: 'name' }, { type: 'contentBlocks' }],
};

const input: RenderSignatureInput = {
  profile: {
    firstName: 'T',
    lastName: 'U',
    title: '',
    email: 't@example.com',
  },
  brand: {
    companyName: 'Co',
    website: '',
    logoUrl: '',
    logoLink: '',
    primaryColor: '#000',
    fontFamily: 'Arial',
    socialLinks: {},
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Links',
        listItems: [
          { title: 'A', url: 'https://list-a.example.com/foo' },
          { title: 'B', url: 'https://list-b.example.com/bar' },
        ],
      },
    ],
  },
  template,
  publicSiteOrigin: 'https://app.example.com',
  utm: { source: 'Tailnote', medium: 'Email', campaign: 'Footer' },
};

let html = renderSignature(input);
assert.ok(html.includes('utm_source'), 'tracking smoke: UTM params applied before click tracking rewrite');

html = appendSignatureClickTracking({
  html,
  organizationId: '507f1f77bcf86cd799439011',
  input,
  baseUrl: 'https://app.example.com',
});

const nTrack = (html.match(/\/api\/track\/signature\?/g) ?? []).length;
assert.ok(nTrack >= 2, `tracking smoke: expected at least 2 tracked list links, got ${nTrack}`);
assert.doesNotMatch(
  html,
  /href="https:\/\/list-a\.example\.com[^"]*utm_source/,
  'tracking smoke: list item href must not stay as raw https URL with utm params'
);

process.stdout.write('signature-tracking-list-smoke: ok\n');
