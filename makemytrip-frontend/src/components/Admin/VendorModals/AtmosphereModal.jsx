import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  RiStoreLine, RiMailLine, RiPhoneLine, RiLockLine,
  RiCloseLine, RiAddLine, RiShieldCheckLine, RiEyeLine,
  RiEyeOffLine, RiGlobalLine, RiBuilding2Line
} from 'react-icons/ri'

const VENDOR_TYPES = {
  flight:    { label: 'Flights',      desc: 'Airlines & charter',          icon: '✈️'  },
  hotel:     { label: 'Hotels',       desc: 'Stays & resorts',             icon: '🏨'  },
  villa:     { label: 'Villas',       desc: 'Homestays & villas',          icon: '🏡'  },
  holiday:   { label: 'Holidays',     desc: 'Vacation packages',           icon: '🧳'  },
  train:     { label: 'Trains',       desc: 'Rail bookings',               icon: '🚆'  },
  bus:       { label: 'Buses',        desc: 'Coach & transfers',           icon: '🚌'  },
  cab:       { label: 'Cabs',         desc: 'Rideshare & transfers',       icon: '🚖'  },
  tour:      { label: 'Tours',        desc: 'Guided packages',             icon: '🎡'  },
  visa:      { label: 'Visas',        desc: 'Permits & e-visas',           icon: '🛂'  },
}

const Icon = ({ name, size = 18, color = 'currentColor' }) => {
  const iconProps = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'plane':   return <svg {...iconProps}><path d="M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3-2.5.5c-.4.1-.6.4-.6.8l.1 1.2 2.5-.5 1 2.4 1.2.1c.4 0 .7-.2.8-.6L9 16.5 12.5 15l3.5 5.5c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
    case 'bed':     return <svg {...iconProps}><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
    case 'car':     return <svg {...iconProps}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18 9.5 13 8 13 8s-3 0-5 0c-2 0-5 4-5 4l-1.6.5C.6 12.6 0 13.5 0 14.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
    case 'train':   return <svg {...iconProps}><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/></svg>
    case 'ship':    return <svg {...iconProps}><path d="M2 20a3 3 0 0 0 3-1 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 2 1"/><path d="M4 18 2 13l10-4 10 4-2 5"/><path d="M12 9V2"/><path d="M8 5h8"/></svg>
    case 'compass': return <svg {...iconProps}><circle cx="12" cy="12" r="9"/><polygon points="16,8 13,13 8,16 11,11"/></svg>
    case 'ticket':  return <svg {...iconProps}><path d="M2 9a2 2 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v14"/></svg>
    case 'shield':  return <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'mail':    return <svg {...iconProps}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
    case 'phone':   return <svg {...iconProps}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9z"/></svg>
    case 'globe':   return <svg {...iconProps}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/></svg>
    case 'lock':    return <svg {...iconProps}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
    case 'eye':     return <svg {...iconProps}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
    case 'check':   return <svg {...iconProps}><polyline points="20 6 9 17 4 12"/></svg>
    case 'plus':    return <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'x':       return <svg {...iconProps}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    case 'arrow':   return <svg {...iconProps}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    case 'info':    return <svg {...iconProps}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>
    case 'spark':   return <svg {...iconProps}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>
    case 'building': return <RiBuilding2Line size={size} color={color} />
    default: return null
  }
}

const FloatingLabelInput = ({ label, type = 'text', leftIcon, placeholder, defaultValue, onFocus, onBlur, onChange, rightSlot, prefix, accent }) => {
  const [value, setValue] = useState(defaultValue || '')
  const [focused, setFocused] = useState(false)
  const isUp = value.length > 0 || focused

  const handleChange = (e) => {
    setValue(e.target.value)
    onChange?.(e)
  }

  const handleFocus = (e) => {
    setFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setFocused(false)
    onBlur?.(e)
  }

  return (
    <div style={{
      position: 'relative',
      background: '#fff',
      borderRadius: '14px',
      border: `1px solid ${focused ? accent : 'rgba(14,21,48,0.10)'}`,
      boxShadow: focused ? `0 0 0 4px rgba(52, 97, 224, 0.08)` : '0 1px 0 rgba(14,21,48,0.02)',
      transition: '.15s',
      padding: '14px 16px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      {leftIcon && (
        <div style={{ color: focused ? accent : 'rgba(14,21,48,0.42)', marginTop: '8px', alignSelf: 'flex-start' }}>
          {typeof leftIcon === 'string' ? <Icon name={leftIcon} size={16} /> : leftIcon}
        </div>
      )}
      <div style={{ flex: 1, position: 'relative' }}>
        <label style={{
          position: 'absolute',
          left: 0,
          top: isUp ? -4 : 14,
          fontSize: isUp ? '10.5px' : '14px',
          letterSpacing: isUp ? '0.08em' : 0,
          textTransform: isUp ? 'uppercase' : 'none',
          fontWeight: isUp ? 600 : 500,
          color: isUp ? (focused ? accent : 'rgba(14,21,48,0.58)') : 'rgba(14,21,48,0.42)',
          transition: '.15s',
          pointerEvents: 'none',
        }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '12px' }}>
          {prefix && <span style={{ fontSize: '14px', color: 'rgba(14,21,48,0.58)', marginRight: '6px' }}>{prefix}</span>}
          <input
            type={type}
            value={value}
            placeholder={focused ? placeholder : ''}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              flex: 1,
              border: 0,
              outline: 'none',
              background: 'transparent',
              font: 'inherit',
              fontSize: '14px',
              color: '#0E1530',
              padding: 0,
            }}
          />
        </div>
      </div>
      {rightSlot}
    </div>
  )
}

export function AtmosphereModal({ onClose, formData, onFormChange, onSubmit, submitting, selectedVendor, showPassword, setShowPassword }) {
  const accent = '#3461E0'
  const accentSoft = '#E8EEFD'
  const ink = '#0E1530'
  const bg = '#F4F7FB'

  const filteredCats = Object.entries(VENDOR_TYPES).map(([k, v]) => ({ k, ...v }))
  const cats = filteredCats

  const sectionsComplete = [
    formData.vendorType !== '',
    formData.name !== '',
    formData.email !== '' && formData.phone !== '',
    formData.password.length >= 8,
  ].filter(Boolean).length

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: bg,
    }} onClick={onClose}>
      {/* Atmospheric backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(900px 500px at 85% -10%, ${accentSoft} 0%, transparent 60%),
          radial-gradient(700px 400px at -5% 110%, ${accentSoft} 0%, transparent 60%),
          linear-gradient(180deg, #EAF1FB 0%, ${bg} 60%, ${bg} 100%)
        `,
        zIndex: 0,
      }} />

      {/* Faint horizon line */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '52%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(52,97,224,0.18), transparent)',
        zIndex: 1,
      }} />

      {/* Modal */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        background: '#fff',
        borderRadius: '24px',
        boxShadow: '0 60px 90px -30px rgba(14,21,48,0.22), 0 2px 4px rgba(14,21,48,0.04)',
        border: `1px solid rgba(14,21,48,0.10)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '28px 32px 22px',
          background: `linear-gradient(180deg, ${accentSoft}55, transparent)`,
          borderBottom: `1px solid rgba(14,21,48,0.10)`,
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                background: '#fff',
                border: `1px solid rgba(14,21,48,0.10)`,
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                color: accent,
                letterSpacing: '0.04em',
                marginBottom: '14px',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '9999px',
                  background: accent,
                  color: '#fff',
                }}>
                  <Icon name="plus" size={10} />
                </span>
                New vendor
              </div>
              <div style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '6px', color: ink }}>
                Welcome a partner aboard
              </div>
              <div style={{ fontSize: '13.5px', color: 'rgba(14,21,48,0.58)', lineHeight: 1.5, maxWidth: '460px' }}>
                Set up a vendor account so they can list inventory and manage bookings from the Vendor Portal.
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                width: '36px',
                height: '36px',
                border: `1px solid rgba(14,21,48,0.10)`,
                borderRadius: '12px',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(14,21,48,0.58)',
                transition: '.15s',
                opacity: submitting ? 0.5 : 1,
              }}
              aria-label="Close"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} style={{ padding: '24px 32px 8px', display: 'flex', flexDirection: 'column', gap: '22px', overflowY: 'auto', flex: 1 }}>

          {/* Category picker */}
          <section>
            <SectionHead n="01" title="Choose a vendor category" hint="Pick what they sell" accent={accent} accentSoft={accentSoft} ink={ink} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', marginTop: '12px' }}>
              {cats.map(c => {
                const on = c.k === formData.vendorType
                return (
                  <button
                    key={c.k}
                    type="button"
                    onClick={() => onFormChange({ target: { name: 'vendorType', value: c.k } })}
                    disabled={submitting}
                    title={c.label}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: '12px',
                      background: on ? accent : '#fff',
                      border: `1px solid ${on ? accent : 'rgba(14,21,48,0.10)'}`,
                      color: on ? '#fff' : ink,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: on ? `0 8px 18px -8px ${accent}80` : '0 1px 0 rgba(14,21,48,0.02)',
                      transition: '.15s',
                      fontSize: '0px',
                      padding: '8px',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{c.icon}</span>
                    <div style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.04em', opacity: on ? 0.95 : 0.7, textTransform: 'uppercase' }}>
                      {c.label.slice(0, 4)}
                    </div>
                    {on && (
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '9999px',
                        background: '#fff',
                        border: `2px solid ${accent}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon name="check" size={8} color={accent} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {formData.vendorType && VENDOR_TYPES[formData.vendorType] && (
              <div style={{
                marginTop: '10px',
                padding: '10px 12px',
                background: accentSoft,
                borderRadius: '10px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accent,
                  border: `1px solid rgba(14,21,48,0.10)`,
                }}>
                  <span style={{ fontSize: '16px' }}>{VENDOR_TYPES[formData.vendorType].icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: ink }}>{VENDOR_TYPES[formData.vendorType].label}</div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(14,21,48,0.58)' }}>{VENDOR_TYPES[formData.vendorType].desc}</div>
                </div>
              </div>
            )}
          </section>

          {/* Business info */}
          <section>
            <SectionHead n="02" title="Business information" accent={accent} accentSoft={accentSoft} ink={ink} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FloatingLabelInput
                  label="Vendor / Business name"
                  leftIcon="building"
                  value={formData.name}
                  onChange={(e) => onFormChange(e)}
                  name="name"
                  placeholder="Legal entity name"
                  defaultValue={formData.name}
                  accent={accent}
                  disabled={submitting}
                />
              </div>
              <FloatingLabelInput
                label="Country"
                leftIcon="globe"
                placeholder="Country of operation"
                defaultValue="India"
                accent={accent}
                disabled={submitting}
              />
              <FloatingLabelInput
                label="GST / Tax ID"
                placeholder="29ABCDE1234F1Z5"
                defaultValue=""
                accent={accent}
                disabled={submitting}
              />
            </div>
          </section>

          {/* Contact */}
          <section>
            <SectionHead n="03" title="Contact details" accent={accent} accentSoft={accentSoft} ink={ink} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <FloatingLabelInput
                label="Email address"
                leftIcon="mail"
                type="email"
                name="email"
                placeholder="ops@example.com"
                defaultValue={formData.email}
                onChange={(e) => onFormChange(e)}
                accent={accent}
                disabled={submitting}
              />
              <FloatingLabelInput
                label="Phone number"
                leftIcon="phone"
                name="phone"
                prefix="+91"
                placeholder="98765 43210"
                defaultValue={formData.phone}
                onChange={(e) => onFormChange(e)}
                accent={accent}
                disabled={submitting}
              />
            </div>
          </section>

          {/* Security */}
          <section>
            <SectionHead n="04" title="Account security" accent={accent} accentSoft={accentSoft} ink={ink} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <FloatingLabelInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                leftIcon="lock"
                name="password"
                placeholder="Minimum 8 characters"
                defaultValue={formData.password}
                onChange={(e) => onFormChange(e)}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'rgba(14,21,48,0.58)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      alignSelf: 'flex-start',
                      marginTop: '8px',
                    }}
                  >
                    {showPassword ? <Icon name="eye" size={14} /> : <Icon name="eye" size={14} />}
                  </button>
                }
                accent={accent}
                disabled={submitting}
              />
              <FloatingLabelInput
                label="Confirm password"
                type="password"
                leftIcon="lock"
                placeholder="Repeat password"
                accent={accent}
                disabled={submitting}
              />
            </div>
            {/* Strength */}
            {formData.password.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background: i <= (formData.password.length >= 12 ? 4 : formData.password.length >= 8 ? 3 : 2) ? accent : 'rgba(14,21,48,0.10)',
                    }} />
                  ))}
                </div>
                <span style={{
                  fontSize: '11.5px',
                  color: accent,
                  fontWeight: 600,
                }}>
                  {formData.password.length >= 12 ? 'Strong' : formData.password.length >= 8 ? 'Good' : 'Weak'}
                </span>
              </div>
            )}
            <div style={{
              marginTop: '12px',
              padding: '10px 12px',
              background: '#FBFAF6',
              border: `1px dashed rgba(14,21,48,0.16)`,
              borderRadius: '10px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}>
              <Icon name="info" size={14} color={'rgba(14,21,48,0.58)'} />
              <div style={{ fontSize: '12px', color: 'rgba(14,21,48,0.58)', lineHeight: 1.5 }}>
                The vendor will use these credentials to sign in to the <strong style={{ color: ink }}>Vendor Portal</strong>. They can rotate the password after first login.
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 32px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid rgba(14,21,48,0.10)`,
          background: '#FBFCFE',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: '18px',
                  height: '4px',
                  borderRadius: '2px',
                  background: i < sectionsComplete ? accent : 'rgba(14,21,48,0.10)',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '11.5px', color: 'rgba(14,21,48,0.58)', fontWeight: 500 }}>
              {sectionsComplete} of 4 sections complete
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '11px 18px',
                borderRadius: '12px',
                background: '#fff',
                border: `1px solid rgba(14,21,48,0.10)`,
                color: ink,
                fontSize: '13.5px',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={onSubmit}
              disabled={submitting}
              style={{
                padding: '11px 18px',
                borderRadius: '12px',
                background: accent,
                border: 0,
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: `0 6px 18px -6px ${accent}99`,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" /> Registering...
                </>
              ) : (
                <>
                  <Icon name="spark" size={14} /> Register vendor
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function SectionHead({ n, title, hint, accent, accentSoft, ink }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '7px',
        background: accentSoft,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10.5px',
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}>
        {n}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: ink, letterSpacing: '-0.01em' }}>{title}</div>
      {hint && <div style={{ fontSize: '12px', color: 'rgba(14,21,48,0.58)' }}>· {hint}</div>}
      <div style={{ flex: 1, height: '1px', background: 'rgba(14,21,48,0.06)' }} />
    </div>
  )
}
