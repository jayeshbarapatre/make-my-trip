import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/FlightBookingFlow.css';

export default function FlightSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || {
    bookingId: "MMT-FL-123456",
    pnr: "MMT-FL-849210",
    status: "confirmed",
    flight: { airline: "IndiGo", flightNumber: "6E-205", departure: { city: "Delhi", time: "06:00" }, arrival: { city: "Mumbai", time: "08:15" } },
    passengers: [{ firstName: "Jayesh", lastName: "Sharma", dob: "1995-05-15", gender: "Male", nationality: "Indian" }],
    totalAmount: 4699,
    baseFare: 4500,
    departureDate: new Date().toISOString().split('T')[0],
    paymentMethod: "UPI / Google Pay"
  };

  const flight = booking.flight || { airline: "IndiGo", flightNumber: "6E-205", departure: { city: "Delhi", time: "06:00" }, arrival: { city: "Mumbai", time: "08:15" } };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('flight-ticket-content');
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
      pdf.save(`FlightTicket_${booking.pnr || 'Booking'}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="flight-flow-wrapper" style={{ background: 'hsl(var(--b2))', minHeight: '100vh', padding: '40px 20px' }}>
      <div className="flight-flow-container" style={{ maxWidth: '860px', margin: '0 auto' }}>

        <div id="flight-ticket-content" style={{ background: 'hsl(var(--b1))', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid hsl(var(--bc) / 0.1)', marginBottom: '24px' }}>

          <div className="flight-success-hero">
            <div style={{ width: '64px', height: '64px', background: 'hsl(var(--su))', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 0 20px rgba(5,150,105,0.4)' }}>
              ✓
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Flight Ticket Confirmed!</h1>
            <p style={{ fontSize: '16px', opacity: 0.8, margin: '8px 0 32px' }}>Your flight from <strong>{flight.departure.city}</strong> to <strong>{flight.arrival.city}</strong> is confirmed.</p>

            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>PNR</span>
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
                  <div style={{ fontWeight: 800, fontSize: '18px', color: 'hsl(var(--bc) / 0.9)' }}>{flight.airline} {flight.flightNumber}</div>
                  <div style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.7)', marginTop: '4px' }}>{flight.departure.city} → {flight.arrival.city}</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid hsl(var(--b3))', paddingTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 600 }}>Departure</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{flight.departure.time}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>{booking.departureDate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 600 }}>Arrival</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{flight.arrival.time}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Same Day</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Passenger Roster</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {booking.passengers?.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'hsl(var(--b2))', padding: '12px', borderRadius: '10px', border: '1px solid hsl(var(--b3))' }}>
                      <div style={{ width: '24px', height: '24px', background: 'hsl(var(--b3))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)' }}>DOB: {p.dob} · {p.nationality}</div>
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
              <p>* Valid Government ID required during check-in. Reach airport 2-3 hours before departure.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="flight-btn-primary"
            onClick={handleDownloadPDF}
          >
            📥 DOWNLOAD PDF TICKET
          </button>
          <button
            className="flight-btn-danger-outline"
            onClick={() => navigate('/my-trips')}
          >
            🧳 MY BOOKINGS
          </button>
          <button
            className="flight-btn-neutral"
            onClick={() => navigate('/')}
          >
            🏠 GO HOME
          </button>
        </div>

      </div>
    </div>
  );
}
