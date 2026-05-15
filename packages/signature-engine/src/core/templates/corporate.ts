/**
 * Premium corporate layout — table-based, inline styles, email-client-safe.
 *
 * Structure:
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  Accent bar (primaryColor, 3px)                                     │
 *   ├─────────┬───────────────────────────────────────────────────────────┤
 *   │  Logo   │  Name / Title / Contact / Social icons                    │
 *   ├─────────┴───────────────────────────────────────────────────────────┤
 *   │  Divider (subtle, primary-tinted)                                   │
 *   ├────────────────────────────────────────────────────────────────────┤
 *   │  Address line (muted)                                               │
 *   ├────────────────────────────────────────────────────────────────────┤
 *   │  Content blocks (full-width row, mobile-safe)                       │
 *   ├────────────────────────────────────────────────────────────────────┤
 *   │  Footer bar (primaryColor, company name in white)                   │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * Uses {{variables}} and {{#if key}}...{{/if}} (nested supported by renderer).
 */
export const CORPORATE_SIGNATURE_TEMPLATE = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; line-height:1.4; max-width:600px;">
  <!-- Accent bar -->
  <tr>
    <td colspan="3" style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="{{primaryColor}}" height="3" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:3px;background-color:{{primaryColor}};border:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:16px;" colspan="3">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <!-- Logo column -->
          <td width="{{logoWidth}}" style="vertical-align:top;line-height:0;font-size:0;padding-right:16px;width:{{logoWidth}}px;">
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

          <!-- Info column -->
          <td style="vertical-align:top; border-left:3px solid {{primaryColor}}; padding-left:16px;">
            {{#if hasName}}
            <div style="font-size:18px; font-weight:700; color:{{primaryColor}}; letter-spacing:-0.2px;">
              {{firstName}} {{lastName}}
            </div>
            {{/if}}

            {{#if hasTitle}}
            <div style="font-size:13px; color:#555; margin-top:3px; text-transform:uppercase; letter-spacing:0.5px; font-weight:500;">
              {{title}}
            </div>
            {{/if}}

            <div style="height:12px;"></div>

            {{#if hasContact}}
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; font-size:13px;">
              {{#if hasOfficePhone}}
              <tr>
                <td colspan="2" valign="top" style="padding:0 0 5px 0;">
                  <a href="{{officePhoneTelHref}}" style="color:#333; text-decoration:none;">
                    {{officePhone}}
                  </a>
                </td>
              </tr>
              {{/if}}
              {{#if hasMobilePhone}}
              <tr>
                <td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 8px 5px 0; color:{{primaryColor}}; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.3px;">Mobile</td>
                <td valign="top" style="padding:0 0 5px 0;">
                  <a href="{{mobilePhoneTelHref}}" style="color:#333; text-decoration:none;">
                    {{mobilePhone}}
                  </a>
                </td>
              </tr>
              {{/if}}
              <tr>
                <td colspan="2" valign="top" style="padding:0 0 5px 0;">
                  <a href="mailto:{{email}}" style="color:{{primaryColor}}; text-decoration:none; font-weight:500;">
                    {{email}}
                  </a>
                </td>
              </tr>
              {{#if hasWebsite}}
              <tr>
                <td colspan="2" valign="top" style="padding:0 0 2px 0;">
                  <a href="{{website}}" style="color:#333; text-decoration:none;">
                    {{websiteDisplay}}
                  </a>
                </td>
              </tr>
              {{/if}}
            </table>
            {{/if}}

            {{#if showSocialBlock}}
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:10px;"><tr>
              {{#if hasLinkedin}}
              <td style="{{socialTdLiStyle}}">
                <a href="{{linkedin}}" style="text-decoration:none;border:0;outline:none;display:inline-block;">
                  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
                    <td width="28" height="28" align="center" valign="middle" bgcolor="{{primaryColor}}" style="width:28px;height:28px;border-radius:14px;text-align:center;vertical-align:middle;background-color:{{primaryColor}};padding:0;">
                      <img src="{{iconLinkedin}}" width="14" height="14" border="0" alt="" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
                    </td>
                  </tr></table>
                </a>
              </td>
              {{/if}}
              {{#if hasFacebook}}
              <td style="{{socialTdFbStyle}}">
                <a href="{{facebook}}" style="text-decoration:none;border:0;outline:none;display:inline-block;">
                  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
                    <td width="28" height="28" align="center" valign="middle" bgcolor="{{primaryColor}}" style="width:28px;height:28px;border-radius:14px;text-align:center;vertical-align:middle;background-color:{{primaryColor}};padding:0;">
                      <img src="{{iconFacebook}}" width="14" height="14" border="0" alt="" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
                    </td>
                  </tr></table>
                </a>
              </td>
              {{/if}}
              {{#if hasInstagram}}
              <td style="{{socialTdIgStyle}}">
                <a href="{{instagram}}" style="text-decoration:none;border:0;outline:none;display:inline-block;">
                  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
                    <td width="28" height="28" align="center" valign="middle" bgcolor="{{primaryColor}}" style="width:28px;height:28px;border-radius:14px;text-align:center;vertical-align:middle;background-color:{{primaryColor}};padding:0;">
                      <img src="{{iconInstagram}}" width="14" height="14" border="0" alt="" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
                    </td>
                  </tr></table>
                </a>
              </td>
              {{/if}}
              {{#if hasReddit}}
              <td style="{{socialTdRedditStyle}}">
                <a href="{{reddit}}" style="text-decoration:none;border:0;outline:none;display:inline-block;">
                  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
                    <td width="28" height="28" align="center" valign="middle" bgcolor="{{primaryColor}}" style="width:28px;height:28px;border-radius:14px;text-align:center;vertical-align:middle;background-color:{{primaryColor}};padding:0;">
                      <img src="{{iconReddit}}" width="14" height="14" border="0" alt="" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
                    </td>
                  </tr></table>
                </a>
              </td>
              {{/if}}
              {{#if hasDiscord}}
              <td style="{{socialTdDiscordStyle}}">
                <a href="{{discord}}" style="text-decoration:none;border:0;outline:none;display:inline-block;">
                  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
                    <td width="28" height="28" align="center" valign="middle" bgcolor="{{primaryColor}}" style="width:28px;height:28px;border-radius:14px;text-align:center;vertical-align:middle;background-color:{{primaryColor}};padding:0;">
                      <img src="{{iconDiscord}}" width="14" height="14" border="0" alt="" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
                    </td>
                  </tr></table>
                </a>
              </td>
              {{/if}}
            </tr></table>
            {{/if}}
          </td>

        </tr>
      </table>
    </td>
  </tr>

  {{#if hasDivider}}
  <tr>
    <td colspan="3" style="padding-top:16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="{{primaryColor}}" height="1" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:1px;background-color:{{primaryColor}};border:0;opacity:0.25;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  {{/if}}

  {{#if showAddressBlock}}
  <tr>
    <td colspan="3" style="padding-top:10px; font-size:11px; color:#888; letter-spacing:0.2px;">
      {{addressBlockHtml}}
    </td>
  </tr>
  {{/if}}

  {{#if hasContentBlocks}}
  <tr>
    <td colspan="3" style="padding-top:14px;">
      {{contentBlocksHtml}}
    </td>
  </tr>
  {{/if}}

  <!-- Footer bar -->
  <tr>
    <td colspan="3" style="padding-top:12px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="{{primaryColor}}" height="28" style="font-size:11px;line-height:28px;mso-line-height-rule:exactly;padding:0 12px;height:28px;background-color:{{primaryColor}};border:0;color:#ffffff;font-family:{{fontFamily}}, Arial, Helvetica, sans-serif;font-weight:500;letter-spacing:0.3px;">
            {{companyName}}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
