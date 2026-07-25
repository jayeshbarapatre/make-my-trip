import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/TrainBookingFlow.css';

export default function TrainSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save booking to localStorage on success page load
  useEffect(() => {
    const booking = location.state?.booking || {};
    const train = location.state?.train || {};
    const searchParams = location.state?.searchParams || {};

    if (booking?.bookingId || booking?.pnr) {
      const totalAmount = location.state?.totalAmount || booking.totalAmount || 0;

      const trainBooking = {
        id: booking.bookingId || booking.id || 'TRN-' + Date.now(),
        bookingId: booking.bookingId || 'MMT-TR-' + Math.floor(100000 + Math.random() * 900000),
        pnr: booking.pnr || 'PNR-' + Math.floor(100000 + Math.random() * 900000),
        status: 'confirmed',
        type: 'train',
        // Train Info
        trainName: train.name || booking.trainDetails?.name || 'Train',
        trainNumber: train.number || booking.trainDetails?.number || '',
        fromCity: searchParams.fromCity || booking.fromCity || '',
        toCity: searchParams.toCity || booking.toCity || '',
        departureDate: searchParams.travelDate || booking.departureDate || '',
        returnDate: searchParams.travelDate || booking.departureDate || '',
        travellers: {
          passengers: location.state?.passengers || booking.travellers?.passengers || [],
          classCode: location.state?.selectedClass?.code || booking.travellers?.classCode || '',
          quota: searchParams.quota || booking.travellers?.quota || 'General',
          count: (location.state?.passengers || booking.travellers?.passengers || []).length
        },
        totalAmount: totalAmount,
        paymentId: booking.paymentId || '',
        createdAt: new Date().toISOString(),
        // ✅ ENRICHED TRAIN FIELDS
        baseFare: totalAmount * 0.8,
        taxes: totalAmount * 0.15,
        convenience: totalAmount * 0.05,
        discount: 0,
        gst: totalAmount * 0.05,
        // Payment
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        transactionId: booking.paymentId || ''
      };

      // Save to localStorage
      const existingBookings = JSON.parse(localStorage.getItem('mmt_bookings') || '[]');
      const bookingExists = existingBookings.some(b => b.bookingId === trainBooking.bookingId);

      if (!bookingExists) {
        existingBookings.push(trainBooking);
        localStorage.setItem('mmt_bookings', JSON.stringify(existingBookings));
        console.log('💾 Train booking saved to localStorage:', existingBookings.length);
      }
    }
  }, [location.state]);

  const booking = location.state?.booking || {
    id: "bkg_train_default",
    pnr: "PNR-8492018492",
    bookingId: "MMT-TR-849210",
    fromCity: "New Delhi (NDLS)",
    toCity: "Mumbai Central (BCT)",
    departureDate: new Date().toISOString().split('T')[0],
    travellers: { 
      passengers: [{ name: "Jayesh Sharma", age: 29, gender: "Male", berth: "Lower Berth" }],
      classCode: "3A",
      quota: "General",
      method: "UPI / Google Pay"
    },
    totalAmount: 2160,
    trainDetails: { name: "Rajdhani Express", number: "12952", depTime: "16:55", arrTime: "08:30" }
  };

  const train = booking.trainDetails || { name: "Rajdhani Express", number: "12952", depTime: "16:55", arrTime: "08:30" };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('train-ticket-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: 'hsl(var(--b1))'
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
      pdf.save(`TrainTicket_${booking.pnr || 'Booking'}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="train-flow-wrapper" style={{ background: 'hsl(var(--b2))', minHeight: '100vh', padding: '40px 20px' }}>
      <div className="train-flow-container" style={{ maxWidth: '860px', margin: '0 auto' }}>

        <div id="train-ticket-content" style={{ background: 'hsl(var(--b1))', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid hsl(var(--bc) / 0.1)', marginBottom: '24px' }}>
          
          <div className="train-success-hero">
            <div style={{ width: '64px', height: '64px', background: 'hsl(var(--su))', color: 'hsl(var(--b1))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 0 20px rgba(5,150,105,0.4)' }}>
              ✓
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Train Ticket Confirmed!</h1>
            <p style={{ fontSize: '16px', opacity: 0.8, margin: '8px 0 32px' }}>Your journey from <strong>{booking.fromCity}</strong> is confirmed.</p>
            
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>IRCTC PNR</span>
                <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1px' }}>{booking.pnr}</span>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 32px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>BOOKING ID</span>
                <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1px' }}>{booking.bookingId}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Journey Information</h3>
                <div style={{ background: 'hsl(var(--b2))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: 'hsl(var(--bc) / 0.9)' }}>{train.name} ({train.number})</div>
                  <div style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.7)', marginTop: '4px' }}>{booking.fromCity} → {booking.toCity}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid hsl(var(--b3))', paddingTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 600 }}>Departure</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{train.depTime}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>{booking.departureDate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 600 }}>Arrival</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{train.arrTime}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Next Day</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Passenger Roster</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {booking.travellers?.passengers?.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'hsl(var(--b2))', padding: '12px', borderRadius: '10px', border: '1px solid hsl(var(--b3))' }}>
                      <div style={{ width: '24px', height: '24px', background: 'hsl(var(--b3))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)' }}>Age: {p.age} · {p.berth} · {booking.travellers?.classCode}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px dashed hsl(var(--b3))', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 600 }}>Total Paid</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--er))' }}>₹{booking.totalAmount?.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid hsl(var(--b2))', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--bc) / 0.5)' }}>
              <p>* Valid Identity Proof required during travel. Support: 1800 102 8747</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="train-btn-primary"
            onClick={handleDownloadPDF}
          >
            📥 DOWNLOAD PDF TICKET
          </button>
          <button
            className="train-btn-danger-outline"
            onClick={() => navigate('/my-trips')}
          >
            🧳 MY BOOKINGS
          </button>
          <button
            className="train-btn-neutral"
            onClick={() => navigate('/')}
          >
            🏠 GO HOME
          </button>
        </div>

      </div>
    </div>
  );
}
