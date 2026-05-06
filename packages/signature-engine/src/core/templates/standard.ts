/**
 * Table-based standard layout (logo left, contact right).
 * Uses {{variables}} and {{#if key}}...{{/if}} (non-nested).
 */
export const STANDARD_SIGNATURE_TEMPLATE = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; line-height:1.4;">
  <tr>
    <!-- LEFT: LOGO -->
    <td style="vertical-align:top; padding-right:16px;">
      {{#if hasLogo}}
      <a href="{{logoLink}}" style="text-decoration:none;">
        <img src="{{logoUrl}}" width="110" style="display:block; border:0;" />
      </a>
      {{/if}}
    </td>

    <!-- RIGHT: CONTACT -->
    <td style="vertical-align:top; border-left:2px solid {{primaryColor}}; padding-left:16px;">
      
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
          <td valign="top" style="padding:0 4px 4px 0; color:#000; font-weight:700;">Office:</td>
          <td valign="top" style="padding:0 0 4px 0;">
            <a href="{{officePhoneTelHref}}" style="color:#1a1a1a; text-decoration:none;">
              {{officePhone}}
            </a>
          </td>
        </tr>
        {{/if}}
        {{#if hasMobilePhone}}
        <tr>
          <td valign="top" style="padding:0 4px 4px 0; color:#000; font-weight:700;">Mobile:</td>
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
      <div style="margin-top:10px;">
        {{#if hasLinkedin}}
        <a href="{{linkedin}}" style="text-decoration:none; margin-right:8px;">
          <img src="{{iconLinkedin}}" width="16" style="display:inline-block; border:0;" />
        </a>
        {{/if}}

        {{#if hasFacebook}}
        <a href="{{facebook}}" style="text-decoration:none; margin-right:8px;">
          <img src="{{iconFacebook}}" width="16" style="display:inline-block; border:0;" />
        </a>
        {{/if}}

        {{#if hasInstagram}}
        <a href="{{instagram}}" style="text-decoration:none;">
          <img src="{{iconInstagram}}" width="16" style="display:inline-block; border:0;" />
        </a>
        {{/if}}
      </div>
      {{/if}}
    </td>
  </tr>

  {{#if hasDivider}}
  <tr>
    <td colspan="2" style="padding-top:14px;">
      <div style="height:1px; background:#e5e5e5;"></div>
    </td>
  </tr>
  {{/if}}

  {{#if showLocationsRow}}
  <tr>
    <td colspan="2" style="padding-top:10px; font-size:12px; color:#555;">
      {{#if showLocationsLines}}
      <strong style="color:#000;">Design Studios</strong><br/>
      {{#if hasDallas}}Dallas: {{dallas}}<br/>{{/if}}
      {{#if hasBoulder}}Boulder: {{boulder}}<br/>{{/if}}
      {{/if}}

      {{#if showWarehouseBlock}}
      <div style="margin-top:6px;">
        <strong style="color:#000;">Design Center / Warehouse</strong><br/>
        {{warehouseAddress}}
      </div>
      {{/if}}
    </td>
  </tr>
  {{/if}}
</table>`;
