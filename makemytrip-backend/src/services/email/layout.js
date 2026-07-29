import { brand } from './brand.js'

const esc = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const money = (amount) => {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export const dateLong = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return esc(value)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export const dateTimeLong = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return esc(value)
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

export const clock = (value) => {
  if (!value) return '—'
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) return esc(value)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return esc(value)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const logoBlock = () => {
  if (brand.logoUrl) {
    return `<img src="${esc(brand.logoUrl)}" width="150" alt="${esc(brand.name)}"
      style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:150px;">`
  }
  // Image-free fallback: renders identically even when the client blocks remote images.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="background:#ffffff;border-radius:8px;width:38px;height:38px;text-align:center;
      font:700 20px/38px Arial,Helvetica,sans-serif;color:${brand.primary};">✈</td>
    <td style="padding-left:12px;font:700 22px/1.2 Arial,Helvetica,sans-serif;color:#ffffff;
      letter-spacing:-.3px;">${esc(brand.name)}</td>
  </tr></table>`
}

/** Label/value line inside a detail card. Rendered as a table row for Outlook safety. */
export const row = (label, value, opts = {}) => {
  if (value === null || value === undefined || value === '' || value === '—') {
    if (!opts.keepEmpty) return ''
  }
  const strong = opts.strong ? '700' : '400'
  const color = opts.color || brand.ink
  return `<tr>
    <td style="padding:9px 0;font:400 13px/1.4 Arial,Helvetica,sans-serif;color:${brand.muted};
      vertical-align:top;width:44%;">${esc(label)}</td>
    <td style="padding:9px 0;font:${strong} 13px/1.4 Arial,Helvetica,sans-serif;color:${color};
      vertical-align:top;text-align:right;">${opts.raw ? value : esc(value)}</td>
  </tr>`
}

/** A bordered card holding a titled group of rows. Returns '' when it has no rows. */
export const card = (title, rowsHtml) => {
  const content = Array.isArray(rowsHtml) ? rowsHtml.filter(Boolean).join('') : rowsHtml
  if (!content || !content.trim()) return ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="border:1px solid ${brand.line};border-radius:10px;margin:0 0 16px;">
    ${title ? `<tr><td style="padding:14px 18px;background:${brand.wash};border-bottom:1px solid ${brand.line};
      border-radius:10px 10px 0 0;font:700 12px/1 Arial,Helvetica,sans-serif;color:${brand.primary};
      letter-spacing:.8px;text-transform:uppercase;">${esc(title)}</td></tr>` : ''}
    <tr><td style="padding:6px 18px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${content}</table>
    </td></tr>
  </table>`
}

export const badge = (text, color = brand.success) =>
  `<span style="display:inline-block;background:${color};color:#ffffff;padding:4px 12px;border-radius:20px;
    font:700 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.5px;text-transform:uppercase;">${esc(text)}</span>`

/** Bulletproof CTA button (VML fallback keeps it clickable and filled in Outlook). */
export const button = (text, url, color = brand.cta) => {
  if (!url) return ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 6px 10px 0;display:inline-block;">
    <tr><td align="center" bgcolor="${color}" style="border-radius:6px;">
      <a href="${esc(url)}" target="_blank"
        style="display:inline-block;padding:12px 26px;font:700 14px/1 Arial,Helvetica,sans-serif;
        color:#ffffff;text-decoration:none;border-radius:6px;">${esc(text)}</a>
    </td></tr></table>`
}

/** The journey strip: origin → destination with times. Used by flight/train/bus/cab. */
export const journeyStrip = ({ from, to, fromTime, toTime, fromSub, toSub, middle }) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="border:1px solid ${brand.line};border-radius:10px;margin:0 0 16px;background:${brand.wash};">
    <tr>
      <td width="38%" style="padding:18px 16px;font-family:Arial,Helvetica,sans-serif;vertical-align:top;">
        <div style="font:700 18px/1.2 Arial,Helvetica,sans-serif;color:${brand.ink};">${esc(from || '—')}</div>
        ${fromTime ? `<div style="font:700 14px/1.6 Arial,Helvetica,sans-serif;color:${brand.primary};">${esc(fromTime)}</div>` : ''}
        ${fromSub ? `<div style="font:400 12px/1.5 Arial,Helvetica,sans-serif;color:${brand.muted};">${esc(fromSub)}</div>` : ''}
      </td>
      <td width="24%" align="center" style="padding:18px 4px;font-family:Arial,Helvetica,sans-serif;vertical-align:top;">
        <div style="font:400 18px/1.2 Arial,Helvetica,sans-serif;color:${brand.primary};">→</div>
        ${middle ? `<div style="font:400 11px/1.6 Arial,Helvetica,sans-serif;color:${brand.muted};">${esc(middle)}</div>` : ''}
      </td>
      <td width="38%" align="right" style="padding:18px 16px;font-family:Arial,Helvetica,sans-serif;vertical-align:top;">
        <div style="font:700 18px/1.2 Arial,Helvetica,sans-serif;color:${brand.ink};">${esc(to || '—')}</div>
        ${toTime ? `<div style="font:700 14px/1.6 Arial,Helvetica,sans-serif;color:${brand.primary};">${esc(toTime)}</div>` : ''}
        ${toSub ? `<div style="font:400 12px/1.5 Arial,Helvetica,sans-serif;color:${brand.muted};">${esc(toSub)}</div>` : ''}
      </td>
    </tr>
  </table>`

/** Passenger/guest table. Accepts [{name, age, gender, seat, type}] */
export const travellerTable = (people = []) => {
  const list = (people || []).filter(Boolean)
  if (!list.length) return ''
  const head = `<tr>
    <th align="left" style="padding:8px 10px;background:${brand.wash};font:700 11px/1 Arial,Helvetica,sans-serif;
      color:${brand.muted};text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid ${brand.line};">Traveller</th>
    <th align="left" style="padding:8px 10px;background:${brand.wash};font:700 11px/1 Arial,Helvetica,sans-serif;
      color:${brand.muted};text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid ${brand.line};">Details</th>
    <th align="right" style="padding:8px 10px;background:${brand.wash};font:700 11px/1 Arial,Helvetica,sans-serif;
      color:${brand.muted};text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid ${brand.line};">Seat</th>
  </tr>`
  const body = list.map((p) => {
    const name = [p.title, p.firstName || p.name, p.lastName].filter(Boolean).join(' ').trim() || 'Guest'
    const meta = [p.gender, p.age ? `${p.age} yrs` : null, p.type].filter(Boolean).join(' · ') || '—'
    return `<tr>
      <td style="padding:10px;font:700 13px/1.4 Arial,Helvetica,sans-serif;color:${brand.ink};
        border-bottom:1px solid ${brand.line};">${esc(name)}</td>
      <td style="padding:10px;font:400 12px/1.4 Arial,Helvetica,sans-serif;color:${brand.muted};
        border-bottom:1px solid ${brand.line};">${esc(meta)}</td>
      <td align="right" style="padding:10px;font:700 13px/1.4 Arial,Helvetica,sans-serif;color:${brand.primary};
        border-bottom:1px solid ${brand.line};">${esc(p.seat || p.seatNumber || '—')}</td>
    </tr>`
  }).join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="border:1px solid ${brand.line};border-radius:10px;border-collapse:separate;overflow:hidden;margin:0 0 16px;">
    ${head}${body}
  </table>`
}

/** Fare breakdown with an emphasised total line. */
export const fareTable = (lines = [], total) => {
  const items = lines.filter(l => l && Number.isFinite(Number(l.amount)) && Number(l.amount) !== 0).map(l => `
    <tr>
      <td style="padding:7px 0;font:400 13px/1.4 Arial,Helvetica,sans-serif;color:${brand.muted};">${esc(l.label)}</td>
      <td align="right" style="padding:7px 0;font:400 13px/1.4 Arial,Helvetica,sans-serif;color:${brand.ink};">${money(l.amount)}</td>
    </tr>`).join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="border:1px solid ${brand.line};border-radius:10px;margin:0 0 16px;">
    <tr><td style="padding:14px 18px;background:${brand.wash};border-bottom:1px solid ${brand.line};
      border-radius:10px 10px 0 0;font:700 12px/1 Arial,Helvetica,sans-serif;color:${brand.primary};
      letter-spacing:.8px;text-transform:uppercase;">Fare Summary</td></tr>
    <tr><td style="padding:8px 18px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${items}
        <tr><td colspan="2" style="border-top:1px solid ${brand.line};height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:12px 0 2px;font:700 15px/1.4 Arial,Helvetica,sans-serif;color:${brand.ink};">Total Paid</td>
          <td align="right" style="padding:12px 0 2px;font:700 20px/1.4 Arial,Helvetica,sans-serif;color:${brand.primary};">${money(total)}</td>
        </tr>
      </table>
    </td></tr>
  </table>`
}

export const note = (title, text, color = '#f59e0b') => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#fffbeb;border-left:4px solid ${color};border-radius:6px;margin:0 0 16px;">
    <tr><td style="padding:14px 16px;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#78350f;">
      <strong style="color:#78350f;">${esc(title)}</strong><br>${esc(text)}
    </td></tr>
  </table>`

/**
 * Wraps body HTML in the responsive shell: preheader, branded header, content, support footer.
 * `hero` renders the confirmation banner; omit it for non-booking mail.
 */
export const renderLayout = ({ preheader = '', hero = '', body = '', footerNote = '' }) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(brand.name)}</title>
<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{margin:0!important;padding:0!important;width:100%!important;background:#eef2f7;}
  a{color:${brand.cta};}
  @media screen and (max-width:620px){
    .wrap{width:100%!important;}
    .pad{padding-left:18px!important;padding-right:18px!important;}
    .stack{display:block!important;width:100%!important;text-align:left!important;}
  }
  @media (prefers-color-scheme:dark){
    /* Transactional mail stays light-on-light by design so brand colours and
       status badges keep their meaning in every client. */
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
<div style="display:none;font-size:1px;color:#eef2f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f7;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0"
      style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;
      box-shadow:0 1px 3px rgba(16,24,40,.08);">

      <tr><td class="pad" style="padding:22px 28px;background:${brand.primary};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="left">${logoBlock()}</td>
          <td align="right" style="font:400 11px/1.4 Arial,Helvetica,sans-serif;color:rgba(255,255,255,.75);">
            ${esc(brand.tagline)}
          </td>
        </tr></table>
      </td></tr>

      ${hero}

      <tr><td class="pad" style="padding:26px 28px 8px;">${body}</td></tr>

      <tr><td class="pad" style="padding:8px 28px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="border-top:1px solid ${brand.line};">
          <tr><td style="padding:18px 0 0;font:400 12px/1.7 Arial,Helvetica,sans-serif;color:${brand.muted};">
            <strong style="color:${brand.ink};">Need help?</strong><br>
            Email <a href="mailto:${esc(brand.supportEmail)}" style="color:${brand.cta};text-decoration:none;">${esc(brand.supportEmail)}</a>
            &nbsp;·&nbsp; Call <span style="color:${brand.ink};">${esc(brand.supportPhone)}</span><br>
            Our support team is available 24×7.
          </td></tr>
        </table>
      </td></tr>

      <tr><td class="pad" style="padding:18px 28px;background:${brand.wash};border-top:1px solid ${brand.line};
        font:400 11px/1.7 Arial,Helvetica,sans-serif;color:${brand.muted};text-align:center;">
        ${footerNote ? `${esc(footerNote)}<br>` : ''}
        © ${new Date().getFullYear()} ${esc(brand.name)}. All rights reserved.<br>
        This is an automated message — please do not reply to this email.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

export const heroBanner = ({ title, subtitle, color = brand.success }) => `
  <tr><td class="pad" align="center" style="padding:30px 28px 22px;background:${color};">
    <div style="font:700 15px/1 Arial,Helvetica,sans-serif;color:rgba(255,255,255,.85);letter-spacing:2px;
      text-transform:uppercase;margin:0 0 10px;">${esc(title)}</div>
    <div style="font:700 26px/1.3 Arial,Helvetica,sans-serif;color:#ffffff;">${esc(subtitle)}</div>
  </td></tr>`

export { esc }
