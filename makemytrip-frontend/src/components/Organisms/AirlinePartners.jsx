import React from 'react'
import SectionHeader from '../Atoms/SectionHeader'
import ImageCard from '../Atoms/ImageCard'
import { AIRLINES } from '../../data/homepageData'
import '../../styles/Sections.css'

export default function AirlinePartners() {
  return (
    <section className="airlines-section">
      <div className="airlines-inner">
        <SectionHeader title="Experience Flying with our Airline Partners" />
        <div className="airlines-grid">
          {AIRLINES.map((a) => (
            <ImageCard
              key={a.name}
              variant="airline"
              title={a.name}
              subtitle="Fly premium class flights with curated airline partners worldwide"
              imageUrl={a.img}
              borderColor={a.color}
              buttonText="Explore Flights"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
