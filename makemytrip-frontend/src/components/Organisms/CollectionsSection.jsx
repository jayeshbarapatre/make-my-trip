import { useState } from 'react'
import SectionHeader from '../Atoms/SectionHeader'
import ImageCard from '../Atoms/ImageCard'
import { COLLECTIONS, WONDERS } from '../../data/homepageData'
import '../../styles/Sections.css'

export default function CollectionsSection() {
  const [collectionsIndex, setCollectionsIndex] = useState(0)
  const [wondersIndex, setWondersIndex] = useState(0)

  const handleCollectionsPrev = () => {
    setCollectionsIndex((prev) => Math.max(0, prev - 1))
  }

  const handleCollectionsNext = () => {
    setCollectionsIndex((prev) => Math.min(COLLECTIONS.length - 4, prev + 1))
  }

  const handleWondersPrev = () => {
    setWondersIndex((prev) => Math.max(0, prev - 1))
  }

  const handleWondersNext = () => {
    setWondersIndex((prev) => Math.min(WONDERS.length - 4, prev + 1))
  }

  return (
    <>
      {/* 1. Handpicked Collections */}
      <section className="collections-section">
        <div className="collections-inner">
          <SectionHeader
            title="Handpicked Collections for You"
            viewAllText="View All"
            onPrev={collectionsIndex > 0 ? handleCollectionsPrev : null}
            onNext={collectionsIndex < COLLECTIONS.length - 4 ? handleCollectionsNext : null}
          />
          <div className="collections-gallery-wrapper">
            <div 
              className="dest-grid"
              style={{
                transform: `translateX(-${collectionsIndex * 25}%)`,
                transition: 'transform 0.4s ease-in-out',
                display: 'flex',
                gap: '16px',
                width: '100%'
              }}
            >
              {COLLECTIONS.map((c, i) => (
                <div key={i} className="gallery-item-card">
                  <ImageCard
                    variant="destination"
                    title={c.title}
                    subtitle={c.sub}
                    imageUrl={c.img}
                    badge={c.rank}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Lesser-known Wonders */}
      <section className="wonders-section">
        <div className="wonders-inner">
          <SectionHeader
            title="Unlock Lesser-Known Wonders of India"
            viewAllText="View All"
            onPrev={wondersIndex > 0 ? handleWondersPrev : null}
            onNext={wondersIndex < WONDERS.length - 4 ? handleWondersNext : null}
          />
          <div className="collections-gallery-wrapper">
            <div 
              className="dest-grid"
              style={{
                transform: `translateX(-${wondersIndex * 25}%)`,
                transition: 'transform 0.4s ease-in-out',
                display: 'flex',
                gap: '16px',
                width: '100%'
              }}
            >
              {WONDERS.map((w, i) => (
                <div key={i} className="gallery-item-card">
                  <ImageCard
                    variant="destination"
                    title={w.title}
                    subtitle={w.sub}
                    imageUrl={w.img}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
