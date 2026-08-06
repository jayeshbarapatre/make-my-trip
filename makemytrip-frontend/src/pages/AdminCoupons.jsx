import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminLayout from '../components/Admin/AdminLayout'
import DataPanel from '../components/Admin/DataPanel'
import { couponsAdminService } from '../services/platformAdminService'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const BLANK = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  maxDiscount: '',
  minAmount: '',
  maxPerUser: '',
  maxRedemptions: '',
  validFrom: '',
  validTo: '',
  appliesTo: [],
  isActive: true
}

const TYPES = ['flight', 'hotel', 'bus', 'train', 'cab']

const field = {
  padding: '9px 11px', borderRadius: '8px', border: '1px solid hsl(var(--b3))',
  background: 'hsl(var(--b1))', color: 'hsl(var(--bc))', fontSize: '14px', width: '100%'
}
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)' }

export default function AdminCoupons() {
  const confirm = useConfirm()
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsAdminService.list()
  })

  const coupons = data?.data ?? []

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const toggleType = (t) =>
    setForm((p) => ({
      ...p,
      appliesTo: p.appliesTo.includes(t) ? p.appliesTo.filter((x) => x !== t) : [...p.appliesTo, t]
    }))

  const submit = async (e) => {
    e.preventDefault()

    // Mirror the server rules so obvious mistakes are caught before a round trip.
    if (!form.code.trim()) return toast.error('A coupon code is required')
    const value = Number(form.discountValue)
    if (!Number.isFinite(value) || value <= 0) return toast.error('Discount value must be a positive number')
    if (form.discountType === 'percent' && value > 100) return toast.error('A percentage discount cannot exceed 100')
    if (form.validFrom && form.validTo && form.validFrom > form.validTo) return toast.error('The end date must be after the start date')

    // Send null rather than '' for the optional numeric limits.
    const num = (v) => (v === '' || v === null ? null : Number(v))

    setSaving(true)
    try {
      await couponsAdminService.save({
        ...form,
        discountValue: value,
        maxDiscount: num(form.maxDiscount),
        minAmount: num(form.minAmount),
        maxPerUser: num(form.maxPerUser),
        maxRedemptions: num(form.maxRedemptions),
        validFrom: form.validFrom || null,
        validTo: form.validTo || null
      })
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setForm(BLANK)
      toast.success('Coupon saved')
    } catch (err) {
      toast.error(err.message || 'Could not save the coupon')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (code) => {
    if (!await confirm({
      title: `Remove coupon ${code}?`,
      message: 'Existing bookings keep their discount. New checkouts will no longer accept this code.',
      confirmLabel: 'Remove',
      tone: 'danger'
    })) return
    try {
      await couponsAdminService.remove(code)
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon removed')
    } catch (err) {
      toast.error(err.message || 'Could not remove the coupon')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Coupons</h1>
            <p>Discounts are calculated server-side at checkout — these limits are enforced, not advisory.</p>
          </div>
        </div>

        <form onSubmit={submit} style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', padding: '18px', marginBottom: '22px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800 }}>Create or update a coupon</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <label style={labelStyle}>CODE
              <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" style={field} required />
            </label>
            <label style={labelStyle}>TYPE
              <select value={form.discountType} onChange={(e) => set('discountType', e.target.value)} style={field}>
                <option value="percent">Percentage</option>
                <option value="flat">Flat amount</option>
              </select>
            </label>
            <label style={labelStyle}>{form.discountType === 'percent' ? 'PERCENT OFF' : 'AMOUNT OFF (₹)'}
              <input type="number" min="1" max={form.discountType === 'percent' ? 100 : undefined} value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} style={field} required />
            </label>
            <label style={labelStyle}>MAX DISCOUNT (₹)
              <input type="number" min="0" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} placeholder="no cap" style={field} />
            </label>
            <label style={labelStyle}>MIN BOOKING (₹)
              <input type="number" min="0" value={form.minAmount} onChange={(e) => set('minAmount', e.target.value)} placeholder="none" style={field} />
            </label>
            <label style={labelStyle}>USES PER CUSTOMER
              <input type="number" min="0" value={form.maxPerUser} onChange={(e) => set('maxPerUser', e.target.value)} placeholder="unlimited" style={field} />
            </label>
            <label style={labelStyle}>TOTAL USES
              <input type="number" min="0" value={form.maxRedemptions} onChange={(e) => set('maxRedemptions', e.target.value)} placeholder="unlimited" style={field} />
            </label>
            <label style={labelStyle}>VALID FROM
              <input type="date" value={form.validFrom} onChange={(e) => set('validFrom', e.target.value)} style={field} />
            </label>
            <label style={labelStyle}>VALID TO
              <input type="date" value={form.validTo} onChange={(e) => set('validTo', e.target.value)} style={field} />
            </label>
          </div>

          <label style={{ ...labelStyle, marginTop: '12px' }}>DESCRIPTION
            <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown to the customer" style={field} />
          </label>

          <fieldset style={{ border: 'none', padding: 0, margin: '14px 0 0' }}>
            <legend style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', padding: 0 }}>
              APPLIES TO <span style={{ fontWeight: 500 }}>(none selected = all types)</span>
            </legend>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {TYPES.map((t) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', border: '1px solid hsl(var(--b3))', cursor: 'pointer', fontSize: '13px', background: form.appliesTo.includes(t) ? 'hsl(var(--p) / 0.12)' : 'transparent' }}>
                  <input type="checkbox" checked={form.appliesTo.includes(t)} onChange={() => toggleType(t)} />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={saving} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'hsl(var(--p))', color: 'hsl(var(--pc))', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save coupon'}
          </button>
        </form>

        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', overflow: 'hidden' }}>
          <DataPanel loading={isPending} error={error?.message} onRetry={refetch} isEmpty={coupons.length === 0} emptyText="No coupons yet.">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '720px' }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--b2))' }}>
                    {['Code', 'Discount', 'Min spend', 'Applies to', 'Used', 'Active', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontWeight: 700, color: 'hsl(var(--bc) / 0.7)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid hsl(var(--b3))' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800 }}>{c.code}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                        {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}
                      </td>
                      <td style={{ padding: '10px 14px' }}>{c.minAmount ? `₹${c.minAmount}` : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>{c.appliesTo?.length ? c.appliesTo.join(', ') : 'all'}</td>
                      <td style={{ padding: '10px 14px' }}>{c.redemptionCount ?? 0}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}</td>
                      <td style={{ padding: '10px 14px' }}>{c.isActive ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => remove(c.code)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid hsl(var(--er))', background: 'transparent', color: 'hsl(var(--er))', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataPanel>
        </div>
      </div>
    </AdminLayout>
  )
}
