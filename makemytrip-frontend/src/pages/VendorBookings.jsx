import VendorLayout from '../components/Vendor/VendorLayout'
import { DataTable, PageHeader, Badge, StatusBadge, Card } from '../components/ui'
import useGenericCRUD from '../hooks/useGenericCRUD'

export default function VendorBookings() {
  const { items: bookings, loading } = useGenericCRUD('/vendor/bookings')

  // Mock bookings for vendor
  const mockBookings = [
    {
      id: 1,
      bookingId: 'BK001',
      customer: 'John Doe',
      item: 'Emirates EK5001',
      category: 'flight',
      amount: 15000,
      status: 'CONFIRMED',
      quantity: 2,
      date: '2024-01-15'
    },
    {
      id: 2,
      bookingId: 'BK002',
      customer: 'Jane Smith',
      item: 'Taj Mahal Hotel',
      category: 'hotel',
      amount: 8500,
      status: 'CONFIRMED',
      quantity: 3,
      date: '2024-01-14'
    },
    {
      id: 3,
      bookingId: 'BK003',
      customer: 'Mike Johnson',
      item: 'Paradise Resort',
      category: 'hotel',
      amount: 5400,
      status: 'CANCELLED',
      quantity: 1,
      date: '2024-01-13'
    }
  ]

  const getCategoryColor = (category) => {
    const colors = { flight: 'info', hotel: 'success', bus: 'warning', cab: 'error' }
    return colors[category] || 'primary'
  }

  const columns = [
    {
      key: 'bookingId',
      label: 'Booking ID',
      render: (value) => <span className="font-mono font-semibold">{value}</span>
    },
    {
      key: 'customer',
      label: 'Customer'
    },
    {
      key: 'item',
      label: 'Item'
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => <Badge variant={getCategoryColor(value)}>{value.toUpperCase()}</Badge>
    },
    {
      key: 'quantity',
      label: 'Qty'
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span className="font-semibold text-primary">₹{value.toLocaleString()}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'date',
      label: 'Date'
    }
  ]

  const totalRevenue = mockBookings.reduce((sum, b) => sum + (b.status === 'CONFIRMED' ? b.amount : 0), 0)
  const confirmedCount = mockBookings.filter(b => b.status === 'CONFIRMED').length

  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Bookings"
          description="Track all bookings for your listings"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-70">Total Bookings</p>
                <p className="text-3xl font-bold">{mockBookings.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-70">Confirmed</p>
                <p className="text-3xl font-bold text-success">{confirmedCount}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-70">Revenue</p>
                <p className="text-3xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Bookings Table */}
        <DataTable
          columns={columns}
          data={mockBookings}
          loading={loading}
        />
      </div>
    </VendorLayout>
  )
}
