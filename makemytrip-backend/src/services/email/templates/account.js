import { brand } from '../brand.js'
import { renderLayout, heroBanner, card, row, button, note, dateTimeLong, esc } from '../layout.js'

export const renderWelcome = (user = {}) => {
  const name = user.name || 'Traveller'
  const email = user.email || ''
  const registeredAt = user.createdAt || new Date().toISOString()

  const perks = [
    ['✈', 'Flights', 'Compare fares across airlines and book in seconds.'],
    ['🏨', 'Hotels', 'Handpicked stays with free cancellation options.'],
    ['🚆', 'Trains & Buses', 'Live availability and instant e-tickets.'],
    ['🚕', 'Cabs', 'Airport transfers and outstation rides on demand.']
  ]

  const body = `
    <p style="margin:0 0 6px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${brand.ink};">
      Hi <strong>${esc(name)}</strong>,
    </p>
    <p style="margin:0 0 20px;font:400 14px/1.7 Arial,Helvetica,sans-serif;color:${brand.muted};">
      Your ${esc(brand.name)} account is ready. You can now book flights, hotels, trains, buses and cabs —
      and keep every trip in one place.
    </p>

    ${card('Your Account', [
      row('Name', name),
      row('Email Address', email),
      row('Registered On', dateTimeLong(registeredAt)),
      row('Account Status', 'Active', { strong: true, color: brand.success })
    ])}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border:1px solid ${brand.line};border-radius:10px;margin:0 0 18px;">
      <tr><td style="padding:14px 18px;background:${brand.wash};border-bottom:1px solid ${brand.line};
        border-radius:10px 10px 0 0;font:700 12px/1 Arial,Helvetica,sans-serif;color:${brand.primary};
        letter-spacing:.8px;text-transform:uppercase;">What you can do</td></tr>
      ${perks.map(([icon, title, desc], i) => `
      <tr><td style="padding:14px 18px;${i < perks.length - 1 ? `border-bottom:1px solid ${brand.line};` : ''}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="34" valign="top" style="font-size:20px;line-height:1.2;">${icon}</td>
          <td valign="top" style="font-family:Arial,Helvetica,sans-serif;">
            <div style="font:700 14px/1.4 Arial,Helvetica,sans-serif;color:${brand.ink};">${esc(title)}</div>
            <div style="font:400 13px/1.6 Arial,Helvetica,sans-serif;color:${brand.muted};">${esc(desc)}</div>
          </td>
        </tr></table>
      </td></tr>`).join('')}
    </table>

    <div style="margin:4px 0 18px;">
      ${button('Start Exploring', brand.appUrl)}
    </div>

    ${note('Keep your account secure', 'We will never ask for your password or OTP over phone or email. If you did not create this account, contact us immediately.')}
  `

  return {
    subject: `Welcome to ${brand.name}, ${name}!`,
    html: renderLayout({
      preheader: `Your ${brand.name} account is ready — start booking flights, hotels, trains, buses and cabs.`,
      hero: heroBanner({ title: 'Account Created', subtitle: `Welcome aboard, ${name}!`, color: brand.primary }),
      body,
      footerNote: `Sent to ${email} because an account was created with this address.`
    }),
    text: [
      `Welcome to ${brand.name}, ${name}!`,
      ``,
      `Your account has been created successfully.`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Registered On: ${dateTimeLong(registeredAt)}`,
      `Status: Active`,
      ``,
      `Start exploring: ${brand.appUrl}`,
      `Support: ${brand.supportEmail}`
    ].join('\n')
  }
}

const PURPOSE_COPY = {
  login: { title: 'Verification Code', lead: 'Use the code below to sign in to your account.' },
  signup: { title: 'Verify Your Email', lead: 'Use the code below to finish creating your account.' },
  password_reset: { title: 'Password Reset Code', lead: 'Use the code below to reset your password.' },
  verify: { title: 'Verification Code', lead: 'Use the code below to verify your email address.' }
}

export const renderOtp = ({ otp, purpose = 'verify', ttlMinutes = 5 }) => {
  const copy = PURPOSE_COPY[purpose] || PURPOSE_COPY.verify
  const digits = String(otp)

  const body = `
    <p style="margin:0 0 20px;font:400 14px/1.7 Arial,Helvetica,sans-serif;color:${brand.muted};">
      ${esc(copy.lead)} It expires in <strong style="color:${brand.ink};">${ttlMinutes} minutes</strong>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border:2px dashed ${brand.primary};border-radius:12px;margin:0 0 20px;background:${brand.wash};">
      <tr><td align="center" style="padding:26px 18px;">
        <div style="font:400 11px/1 Arial,Helvetica,sans-serif;color:${brand.muted};
          text-transform:uppercase;letter-spacing:1.2px;margin:0 0 12px;">Your one-time code</div>
        <div style="font:700 40px/1.1 'Courier New',Courier,monospace;color:${brand.primary};
          letter-spacing:12px;text-indent:12px;">${esc(digits)}</div>
      </td></tr>
    </table>

    ${note('Never share this code', `${brand.name} staff will never ask you for this code. If you did not request it, you can safely ignore this email — no changes have been made to your account.`, brand.accent)}
  `

  return {
    subject: `${digits} is your ${brand.name} verification code`,
    html: renderLayout({
      preheader: `${digits} is your verification code. It expires in ${ttlMinutes} minutes.`,
      hero: heroBanner({ title: 'Security', subtitle: copy.title, color: brand.primary }),
      body
    }),
    text: [
      `${copy.title}`,
      ``,
      `Your ${brand.name} verification code is: ${digits}`,
      `This code expires in ${ttlMinutes} minutes.`,
      ``,
      `Never share this code with anyone. If you did not request it, ignore this email.`
    ].join('\n')
  }
}

export default { renderWelcome, renderOtp }
