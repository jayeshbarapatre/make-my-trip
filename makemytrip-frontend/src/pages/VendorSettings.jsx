import { useState } from 'react'
import VendorLayout from '../components/Vendor/VendorLayout'
import { useVendor } from '../context/VendorContext'

const VendorSettings = () => {
  const { vendor } = useVendor()
  const [settings, setSettings] = useState({
    businessName: vendor?.name || 'Shrey Vendor',
    contactEmail: vendor?.email || 'shrey@gmail.com',
    taxId: '27AAAAA1111A1Z1',
    autoAccept: true,
    cancelPolicy: '24h',
    notifyNewBooking: true,
    notifyListingApproval: true
  })
  const [isSaved, setIsSaved] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <VendorLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 0' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Configure your business profile, tax configurations, and system alert preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Business Info */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Business Profile
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Registered Business Name</label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Business Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Booking & Policy Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Default Cancellation Policy</label>
                <select
                  value={settings.cancelPolicy}
                  onChange={(e) => setSettings({ ...settings, cancelPolicy: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                >
                  <option value="24h">Free cancellation up to 24 hours prior</option>
                  <option value="48h">Free cancellation up to 48 hours prior</option>
                  <option value="non-ref">Non-refundable listings</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '100%', paddingTop: '24px' }}>
                <input
                  type="checkbox"
                  id="autoAccept"
                  checked={settings.autoAccept}
                  onChange={(e) => setSettings({ ...settings, autoAccept: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="autoAccept" style={{ fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600', userSelect: 'none' }}>
                  Auto-accept incoming reservation bookings
                </label>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Notification Alerts
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>New Booking Notification</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Send instant email notifications when customers complete reservations.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyNewBooking}
                  onChange={(e) => setSettings({ ...settings, notifyNewBooking: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>Listing Approval Alerts</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Receive notification as soon as admin approves your listing.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyListingApproval}
                  onChange={(e) => setSettings({ ...settings, notifyListingApproval: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {isSaved && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'var(--success-bg)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              Vendor configurations updated and saved successfully!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              style={{
                background: 'hsl(var(--su))',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px hsl(var(--su) / 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  )
}

export default VendorSettings
