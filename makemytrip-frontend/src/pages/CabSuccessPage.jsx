import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/HotelSuccessPage.css';

export default function CabSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save booking to localStorage on success page load
  useEffect(() => {
    const booking = location.state?.booking || {};
    const cab = location.state?.cab || {};
    const totalAmount = location.state?.totalAmount || booking.totalAmount || 0;

    if (booking?.bookingId || booking?.id) {
      const cabBooking = {
        id: booking.bookingId || booking.id || 'CAB-' + Date.now(),
        bookingId: booking.bookingId || 'MMT-CB-' + Math.floor(100000 + Math.random() * 900000),
        pnr: booking.pnr || 'CAB-' + Math.floor(100000 + Math.random() * 900000),
        status: 'confirmed',
        type: 'cab',
        cabType: cab.type || location.state?.cab?.type || 'Sedan',
        pickupLocation: location.state?.pickupLocation || '',
        dropLocation: location.state?.dropLocation || '',
        distance: location.state?.distance || '',
        estimatedTime: location.state?.estimatedTime || '',
        driverName: cab.driver || location.state?.cab?.driver || '',
        totalAmount: totalAmount,
        paymentId: booking.paymentId || '',
        createdAt: new Date().toISOString(),
        // ✅ ENRICHED CAB FIELDS
        fromCity: location.state?.pickupLocation || '',
        toCity: location.state?.dropLocation || '',
        departureDate: new Date().toISOString().split('T')[0],
        returnDate: new Date().toISOString().split('T')[0],
        travellers: {
          passengers: 1,
          type: cab.type || 'Sedan'
        },
        baseFare: totalAmount * 0.8,
        taxes: totalAmount * 0.15,
        convenience: totalAmount * 0.05,
        discount: 0,
        gst: totalAmount * 0.05,
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        transactionId: booking.paymentId || ''
      };

      const existingBookings = JSON.parse(localStorage.getItem('mmt_bookings') || '[]');
      const bookingExists = existingBookings.some(b => b.bookingId === cabBooking.bookingId);

      if (!bookingExists) {
        existingBookings.push(cabBooking);
        localStorage.setItem('mmt_bookings', JSON.stringify(existingBookings));
        console.log('💾 Cab booking saved to localStorage:', existingBookings.length);
      }
    }
  }, [location.state]);

  const booking = location.state?.booking || {};
  const cab = location.state?.cab || { type: 'Sedan', driver: 'Driver' };
  const pickupLocation = location.state?.pickupLocation || '—';
  const dropLocation = location.state?.dropLocation || '—';
  const distance = location.state?.distance || '—';
  const estimatedTime = location.state?.estimatedTime || '—';
  const totalAmount = location.state?.totalAmount || 0;

  const bookingId = booking.bookingId || 'MMT-CB-' + Math.floor(100000 + Math.random() * 900000);
  const pnr = booking.pnr || 'CAB-' + Math.floor(100000 + Math.random() * 900000);

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
