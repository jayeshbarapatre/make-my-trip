import React from 'react'
import SectionHeader from '../Atoms/SectionHeader'
import ImageCard from '../Atoms/ImageCard'
import { HOTEL_BRANDS } from '../../data/homepageData'
import '../../styles/Sections.css'

export default function HotelStores() {
  return (
    <section className="hotelbrands-section">
      <div className="hotelbrands-inner">
        <SectionHeader title="Flagship Hotel Stores on MakeMyTrip" />
        <div className="hotelbrands-grid">
          {HOTEL_BRANDS.map((h) => (
            <ImageCard
              key={h.name}
              variant="brand"
              title={h.name}
              subtitle="Signature luxury services, premium spaces & memorable holidays."
              imageUrl={h.img}
              borderColor={h.color}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
