import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminApiHealth() {
  const [cacheStats, setCacheStats] = useState(null);
  const [bookingLogs, setBookingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flushing, setFlushing] = useState(false);

  const fetchApiHealth = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/v1/admin/api-health',
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
          }
        }
      );
      setCacheStats(response.data.cacheStats);
      setBookingLogs(response.data.bookingLogs || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch API health:', err);
      setError('Unable to load API health metrics');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiHealth();
    const interval = setInterval(fetchApiHealth, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleFlushCache = async () => {
    if (!window.confirm('Are you sure you want to flush all cached data?')) {
      return;
    }

    setFlushing(true);
    try {
      await axios.post(
        'http://localhost:5000/api/v1/admin/cache/flush',
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
          }
        }
      );
      setError('');
      await fetchApiHealth();
    } catch (err) {
      console.error('Failed to flush cache:', err);
      setError('Failed to flush cache');
    } finally {
      setFlushing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>Loading API Health...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '32px' }}>API Health & Monitoring</h1>

      {error && (
        <div style={{ background: 'hsl(var(--er) / 0.1)', color: 'hsl(var(--er))', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Cache Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>

        {/* Total Cached Keys */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Total Cached Keys
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--bc))' }}>
            {cacheStats?.totalKeys || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Current cache size
          </div>
        </div>

        {/* Active Keys */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--su) / 0.3)', borderRadius: '12px', padding: '24px', borderLeftWidth: '4px', borderLeftColor: 'hsl(var(--su))' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Active Keys
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--su))' }}>
            {cacheStats?.activeKeys || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Not expired
          </div>
        </div>

        {/* Expired Keys */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--er) / 0.3)', borderRadius: '12px', padding: '24px', borderLeftWidth: '4px', borderLeftColor: 'hsl(var(--er))' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Expired Keys
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--er))' }}>
            {cacheStats?.expiredKeys || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Cleaned up on access
          </div>
        </div>

        {/* Hit Rate */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Cache Hit Rate
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--bc))' }}>
            {cacheStats?.hitRate ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Requests served from cache
          </div>
        </div>

      </div>

      {/* Last Flush and Cache Control */}
      <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Cache Management</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '4px' }}>
              Last Flush
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              {cacheStats?.lastFlush ? new Date(cacheStats.lastFlush).toLocaleString() : 'Never'}
            </div>
          </div>
          <button
            onClick={handleFlushCache}
            disabled={flushing}
            style={{
              background: 'hsl(var(--er))',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: flushing ? 'not-allowed' : 'pointer',
              opacity: flushing ? 0.6 : 1
            }}
          >
            {flushing ? 'Flushing...' : '🗑️ Flush Cache'}
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)' }}>
          Force clear all cached search results. Cache will rebuild on next search.
        </div>
      </div>

      {/* Booking Logs */}
      <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Recent Booking Attempts</h2>

        {bookingLogs.length === 0 ? (
          <div style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.5)', textAlign: 'center', padding: '40px 20px' }}>
            No booking attempts yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid hsl(var(--b2))' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase' }}>Booking ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', textTransform: 'uppercase' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {bookingLogs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--b2))', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--b2))'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 700 }}>
                      <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', background: log.type === 'flight' ? 'hsl(var(--p) / 0.15)' : 'hsl(var(--w) / 0.15)', color: log.type === 'flight' ? 'hsl(var(--p))' : 'hsl(var(--w))' }}>
                        {log.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{log.bookingId}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px', background: log.status === 'confirmed' ? 'hsl(var(--su) / 0.15)' : 'hsl(var(--er) / 0.15)', color: log.status === 'confirmed' ? 'hsl(var(--su))' : 'hsl(var(--er))' }}>
                        {log.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 700 }}>₹{log.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'hsl(var(--bc) / 0.5)' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '16px', fontSize: '12px', color: 'hsl(var(--bc) / 0.5)' }}>
          Showing last 20 booking attempts. Real-time updates every 5 seconds.
        </div>
      </div>

      {/* Search Statistics */}
      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

        {/* Flight Searches */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Flight Searches (Today)
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--bc))' }}>
            {cacheStats?.flightSearchCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Cache enabled
          </div>
        </div>

        {/* Train Searches */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Train Searches (Today)
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--bc))' }}>
            {cacheStats?.trainSearchCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Cache enabled
          </div>
        </div>

        {/* Bookings Confirmed */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--su) / 0.3)', borderRadius: '12px', padding: '24px', borderLeftWidth: '4px', borderLeftColor: 'hsl(var(--su))' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Bookings Confirmed (Today)
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--su))' }}>
            {cacheStats?.bookingsConfirmed || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Successful transactions
          </div>
        </div>

        {/* Bookings Failed */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--er) / 0.3)', borderRadius: '12px', padding: '24px', borderLeftWidth: '4px', borderLeftColor: 'hsl(var(--er))' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Bookings Failed (Today)
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--er))' }}>
            {cacheStats?.bookingsFailed || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.5)', marginTop: '8px' }}>
            Failed transactions
          </div>
        </div>

      </div>

    </div>
  );
}
