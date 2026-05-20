import VendorLayout from '../components/Vendor/VendorLayout'
import VendorHotelForm from '../components/Vendor/VendorHotelForm'

const VendorHotelFormPage = () => {
  return (
    <VendorLayout>
      <div className="max-w-3xl mx-auto">
        <VendorHotelForm />
      </div>
    </VendorLayout>
  )
}

export default VendorHotelFormPage
