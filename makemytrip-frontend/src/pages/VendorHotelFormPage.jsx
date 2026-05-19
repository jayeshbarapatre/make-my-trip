import VendorLayout from '../components/Vendor/VendorLayout'
import VendorHotelForm from '../components/Vendor/VendorHotelForm'

const VendorHotelFormPage = () => {
  return (
    <VendorLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
        <VendorHotelForm />
      </div>
    </VendorLayout>
  )
}

export default VendorHotelFormPage
