import { useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import SectionHeader from '../Atoms/SectionHeader'
import { OFFERS, OFFER_TABS } from '../../data/homepageData'
import '../../styles/Sections.css'

function OfferCard({ offer }) {
  return (
    <div className="offer-card">
      <div className="offer-card-visual" style={{ background: offer.color }}>
        <span className="offer-card-icon">{offer.icon}</span>
        <span className="offer-category-pill">{offer.cat}</span>
        <div className="offer-card-img-overlay"
          style={{ backgroundImage: `url(${offer.img})` }} />
      </div>
      <div className="offer-card-body">
        <p className="offer-card-title">{offer.title}</p>
        <p className="offer-card-desc">{offer.desc}</p>
        <button className="offer-card-cta">{offer.cta}</button>
      </div>
    </div>
  )
}

export default function OffersSection() {
  const [activeTab, setActiveTab] = useState('All Offers')
  const swiperRef = useRef(null)

  const filteredOffers = OFFERS.filter((offer) => {
    if (activeTab === 'All Offers') return true
    const cat = offer.cat.toLowerCase()
    const tab = activeTab.toLowerCase()
    if (tab === 'flights') return cat.includes('flight')
    if (tab === 'hotels') return cat.includes('hotel')
    if (tab === 'cabs') return cat === 'cabs'
    if (tab === 'bus') return cat === 'bus'
    if (tab === 'trains') return cat === 'trains'
    if (tab === 'holidays') return cat === 'holidays'
    if (tab === 'bank offers') return cat === 'bank offers'
    if (tab === 'luxury') return cat === 'luxury'
    return true
  })

  const canLoop = filteredOffers.length > 3

  return (
    <section className="offers-section">
      <div className="offers-inner">
        <SectionHeader
          title="Offers"
          tabs={OFFER_TABS}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            swiperRef.current?.slideTo(0)
          }}
          viewAllText="VIEW ALL"
          onPrev={filteredOffers.length > 3 ? () => swiperRef.current?.slidePrev() : null}
          onNext={filteredOffers.length > 3 ? () => swiperRef.current?.slideNext() : null}
        />

        <Swiper
          key={activeTab}
          onSwiper={(s) => { swiperRef.current = s }}
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={3.15}
          spaceBetween={20}
          pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{ delay: 4500, disableOnInteraction: true, pauseOnMouseEnter: true }}
          loop={canLoop}
          className="offers-swiper"
          breakpoints={{
            0:    { slidesPerView: 1.15, spaceBetween: 14 },
            640:  { slidesPerView: 2.1,  spaceBetween: 16 },
            1024: { slidesPerView: 3.15, spaceBetween: 20 },
          }}
        >
          {filteredOffers.map((offer, i) => (
            <SwiperSlide key={i}>
              <OfferCard offer={offer} />
            </SwiperSlide>
          ))}
          {filteredOffers.length === 0 && (
            <SwiperSlide>
              <div className="no-offers-fallback">
                <span className="fallback-icon">🎁</span>
                <p className="fallback-txt">No active offers in this category. Check back soon!</p>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      </div>
    </section>
  )
}
