import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/HotelSuccessPage.css';

export default function CabSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || {};
  const cab = location.state?.cab || { type: 'Sedan', driver: 'Driver' };
  const pickupLocation = location.state?.pickupLocation || '—';
  const dropLocation = location.state?.dropLocation || '—';
  const distance = location.state?.distance || '—';
  const estimatedTime = location.state?.estimatedTime || '—';
  const totalAmount = location.state?.totalAmount || 0;

  // Booking references are issued by the backend. If they are missing the
  // booking did not complete, so show that rather than inventing a reference
  // the user could quote to support.
  const bookingId = booking.bookingId || null;
  const pnr = booking.pnr || null;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('cab-ticket-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`CabTicket_${pnr}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate PDF');
    }
  };

  if (!bookingId) {
    return (
      <div className="succ-wrapper">
        <div className="succ-container" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>Booking reference unavailable</h1>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            We could not confirm this cab booking. If you were charged, it will appear in My Trips shortly.
          </p>
          <button onClick={() => navigate('/my-trips')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'hsl(var(--p))', color: 'hsl(var(--pc))', fontWeight: 700, cursor: 'pointer' }}>
            Go to My Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="succ-wrapper">
      <div className="succ-container">

        <div id="cab-ticket-content" className="succ-ticket-outer">

          {/* Dark Header */}
          <div className="succ-premium-header">
            <div className="succ-icon-glow">✓</div>
            <h1 className="succ-title">Booking Confirmed!</h1>
            <p className="succ-subtitle">Your cab is booked. Driver details will be shared shortly.</p>

            <div className="succ-pnr-ribbon">
              <div className="succ-ribbon-item">
                <span className="succ-ribbon-lbl">CONFIRMATION ID</span>
                <span className="succ-ribbon-val">{pnr}</span>
              </div>
              <div className="succ-ribbon-sep" />
              <div className="succ-ribbon-item">
                <span className="succ-ribbon-lbl">BOOKING ID</span>
                <span className="succ-ribbon-val">{bookingId}</span>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="succ-ticket-body">

            {/* Ride Details */}
            <div className="succ-sec">
              <h3 className="succ-sec-title">Ride Details</h3>
              <div className="succ-prop-card">
                <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>
                  🚖 {cab.type} - {cab.model || 'Standard'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Pickup</div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{pickupLocation}</div>
                  </div>
                  <div style={{ fontSize: '24px' }}>→</div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Drop</div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{dropLocation}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px', paddingTop: '12px', borderTop: '1px solid hsl(var(--b3))' }}>
                  <div className="succ-meta-chip">📏 {distance}</div>
                  <div className="succ-meta-chip">⏱️ {estimatedTime}</div>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            <div className="succ-sec">
              <h3 className="succ-sec-title">Driver Details</h3>
              <div className="succ-prop-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>👤 {cab.driver}</div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Verified Driver</div>
                  </div>
                  <div style={{ fontSize: '20px' }}>⭐ {cab.rating}</div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(var(--b3))', fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>
                  License Plate: {cab.licensePlate}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="succ-sec">
              <h3 className="succ-sec-title">Price Breakdown</h3>
              <div className="succ-price-table">
                <div className="succ-price-row">
                  <span>Base Fare</span>
                  <span>₹ {(totalAmount * 0.8).toLocaleString('en-IN')}</span>
                </div>
                <div className="succ-price-row">
                  <span>Taxes & Fees (18% GST)</span>
                  <span>₹ {(totalAmount * 0.2).toLocaleString('en-IN')}</span>
                </div>
                <div className="succ-price-row total">
                  <span>Total Amount Paid</span>
                  <span>₹ {totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="succ-info-grid">
              <div className="succ-info-item">
                <span className="succ-info-lbl">Payment Status</span>
                <span className="succ-info-val" style={{ color: 'hsl(var(--su))' }}>SUCCESS</span>
              </div>
              <div className="succ-info-item">
                <span className="succ-info-lbl">Booking Status</span>
                <span className="succ-info-val" style={{ color: 'hsl(var(--su))' }}>CONFIRMED</span>
              </div>
            </div>

            <div className="succ-ticket-footer">
              <p>* Driver will contact you shortly. Keep your phone on for driver updates.</p>
              <p>Support: 1800 102 8747 | support@makemytrip.com</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="succ-actions-row">
          <button className="btn-primary succ-action-main" onClick={handleDownloadPDF}>
            📥 DOWNLOAD RECEIPT
          </button>
          <button className="succ-action-sec" onClick={() => navigate('/my-trips')}>
            🧳 MY BOOKINGS
          </button>
          <button className="succ-action-home" onClick={() => navigate('/')}>
            🏠 GO HOME
          </button>
        </div>

      </div>
    </div>
  );
}
