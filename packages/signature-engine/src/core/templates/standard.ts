/**
 * Table-based standard layout (logo left, contact right).
 * Content blocks sit in a third column on desktop; on narrow viewports a duplicate
 * copy renders in a full-width row below (same HTML twice — only one visible via @media).
 * Uses {{variables}} and {{#if key}}...{{/if}} (non-nested).
 */
export const STANDARD_SIGNATURE_TEMPLATE = `<style type="text/css">
@media only screen and (min-width:601px),
  only screen and (min-device-width:601px) {
  table.sig-blocks-mobile-sibling {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  tr.sig-blocks-mobile-host td {
    padding: 0 !important;
    line-height: 0 !important;
    font-size: 0 !important;
  }
  td.sig-blocks-desktop {
    display: table-cell !important;
  }
}
@media only screen and (max-width:600px),
  only screen and (max-width:768px),
  only screen and (max-device-width:600px),
  only screen and (max-device-width:812px) {
  table.sig-root-layout-table {
    table-layout: auto !important;
    width: 100% !important;
  }
  td.sig-logo-stack {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    float: none !important;
    clear: both !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
    padding-bottom: 8px !important;
    box-sizing: border-box !important;
  }
  td.sig-main-stack {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    float: none !important;
    clear: both !important;
    box-sizing: border-box !important;
    border-left: none !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
  }
  td.sig-blocks-desktop {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  table.sig-blocks-mobile-sibling {
    display: table !important;
    width: 100% !important;
    max-height: none !important;
  }
  tr.sig-blocks-mobile-host td {
    line-height: normal !important;
    font-size: 14px !important;
    padding: 0 !important;
  }
  td.sig-blocks-mobile {
    padding-left: 14px !important;
    padding-right: 14px !important;
    padding-top: 14px !important;
    box-sizing: border-box !important;
  }
  td.sig-content-block-cell {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    float: none !important;
    clear: both !important;
    box-sizing: border-box !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 12px !important;
  }
}
</style>
<table class="sig-root-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; line-height:1.4;width:100%;max-width:640px;">
  <tr>
    <td class="sig-logo-stack" width="{{logoWidth}}" style="vertical-align:top;line-height:0;font-size:0;padding-right:24px;width:{{logoWidth}}px;">
      {{#if hasLogo}}
      <a href="{{logoLink}}" style="text-decoration:none; border:0; outline:none; display:inline-block;">
{{#if hasLogoSizedHeight}}
        <img src="{{logoUrl}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;outline:none;text-decoration:none;" />
{{/if}}
{{#if hasLogoAutoHeight}}
        <img src="{{logoUrl}}" width="{{logoWidth}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;outline:none;text-decoration:none;" />
{{/if}}
      </a>
      {{/if}}
    </td>
    <td class="sig-main-stack" style="vertical-align:top; border-left:2px solid {{primaryColor}}; padding-left:14px;padding-right:10px;">
      
      {{#if hasName}}
      <div style="font-size:16px; font-weight:600; color:#000;">
        {{firstName}} {{lastName}}
      </div>
      {{/if}}

      {{#if hasTitle}}
      <div style="font-size:13px; color:#666; margin-top:2px;">
        {{title}}
      </div>
      {{/if}}

      <div style="height:10px;"></div>

      {{#if hasContact}}
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        {{#if hasOfficePhone}}
        <tr>
          <td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 8px 4px 0; color:#000; font-weight:700;">Office:</td>
          <td valign="top" style="padding:0 0 4px 0;">
            <a href="{{officePhoneTelHref}}" style="color:#1a1a1a; text-decoration:none;">
              {{officePhone}}
            </a>
          </td>
        </tr>
        {{/if}}
        {{#if hasMobilePhone}}
        <tr>
          <td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 8px 4px 0; color:#000; font-weight:700;">Mobile:</td>
          <td valign="top" style="padding:0 0 4px 0;">
            <a href="{{mobilePhoneTelHref}}" style="color:#1a1a1a; text-decoration:none;">
              {{mobilePhone}}
            </a>
          </td>
        </tr>
        {{/if}}
        <tr>
          <td colspan="2" valign="top" style="padding:0;">
            <a href="mailto:{{email}}" style="color:{{primaryColor}}; text-decoration:none;">
              {{email}}
            </a>
          </td>
        </tr>
        <tr>
          <td colspan="2" valign="top" style="padding:0;">
            <a href="{{website}}" style="color:#1a1a1a; text-decoration:none;">
              {{website}}
            </a>
          </td>
        </tr>
      </table>
      {{/if}}

      {{#if showSocialBlock}}
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:10px;"><tr>
        {{#if hasLinkedin}}
        <td style="{{socialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconLinkedin}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasFacebook}}
        <td style="{{socialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconFacebook}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasInstagram}}
        <td style="{{socialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconInstagram}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasReddit}}
        <td style="{{socialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconReddit}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
        {{#if hasDiscord}}
        <td style="{{socialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration:none;border:0;outline:none;display:inline-block;"><img src="{{iconDiscord}}" width="16" height="16" border="0" alt="" style="display:block;border:0;outline:none;text-decoration:none;" /></a></td>
        {{/if}}
      </tr></table>
      {{/if}}
    </td>
    {{#if sideColumnContentBlocks}}
    <td class="sig-blocks-stack sig-blocks-desktop" valign="top" style="vertical-align:top;padding-left:12px;border-left:1px solid #e5e5e5;width:54%;min-width:205px;">
      {{contentBlocksHtml}}
    </td>
    {{/if}}
  </tr>
  {{#if sideColumnContentBlocks}}
  <tr class="sig-blocks-mobile-host">
    <td colspan="{{signatureRootColspan}}" style="padding:0;line-height:0;font-size:0;mso-line-height-rule:exactly;">
      <table class="sig-blocks-mobile-sibling" cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="width:100%;max-width:640px;border-collapse:collapse;">
        <tr><td class="sig-blocks-mobile">{{contentBlocksHtml}}</td></tr>
      </table>
    </td>
  </tr>
  {{/if}}

  {{#if hasDivider}}
  <tr>
    <td colspan="{{signatureRootColspan}}" style="padding-top:14px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="#e5e5e5" height="1" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:1px;background-color:#e5e5e5;border:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  {{/if}}

  {{#if showAddressBlock}}
  <tr>
    <td colspan="{{signatureRootColspan}}" style="padding-top:10px; font-size:12px; color:#555;">
      {{addressBlockHtml}}
    </td>
  </tr>
  {{/if}}
</table>`;
