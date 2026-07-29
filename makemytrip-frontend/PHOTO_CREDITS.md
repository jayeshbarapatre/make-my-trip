# Photo Credits & Attribution

Every photograph used in this project is a **real photograph** downloaded from
[Unsplash](https://unsplash.com) and stored locally under `public/images/`.
No vector art, illustrations, AI-generated artwork, cartoons, or third-party
copyrighted stock imagery is used anywhere in the application.

## Licence

All photographs are provided under the [Unsplash License](https://unsplash.com/license),
which grants an irrevocable, nonexclusive, worldwide copyright licence to download, copy,
modify, distribute, perform and use the photos free of charge, including for commercial
purposes, without permission from or attributing the photographer.

Attribution is therefore **not legally required**, but is recorded below in full as good
practice and to credit the photographers whose work appears in this product.

## Asset pipeline

Each source photograph was downloaded once at full quality and re-encoded locally into
responsive derivatives - **WebP** (primary) and **JPEG** (fallback):

| Kind | Widths generated | Used for |
|------|------------------|----------|
| Hero | 1920 / 1280 / 768 px | Full-bleed page banners |
| Card | 800 / 400 px | Cards, thumbnails, gallery tiles |

Total: **89 photographs -> 384 optimised files (~30 MB)**.

Images are referenced through the registry in `src/utils/images.js` and rendered via
`src/components/Common/Photo.jsx`, which emits a `<picture>` element with `srcset`/`sizes`,
`loading="lazy"` and `decoding="async"`. CSS backgrounds switch to narrower variants at
the 1200px and 700px breakpoints.

## Page Heroes & Banners

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `hero-home` | Airplane wing above white clouds during daytime | Johny Goerend | Unsplash | https://images.unsplash.com/photo-1593182440709-4b7b56482c55 |
| `hero-login` | Aerial view of green palms on a tropical seashore | Nattu Adnan | Unsplash | https://images.unsplash.com/photo-1541417904950-b855846fe074 |
| `phero-flights` | Commercial airplane landing on an airport runway | Pascal Meier | Unsplash | https://images.unsplash.com/photo-1556388158-158ea5ccacbd |
| `phero-hotels` | Beach resort overlooking the blue sea | Saad Khan | Unsplash | https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9 |
| `phero-trains` | Modern high-speed bullet train at a station | Ryan Lu | Unsplash | https://images.unsplash.com/photo-1523667071851-4fda8c8a8dd5 |
| `phero-buses` | Long-distance coach bus on a mountain highway | Juan Encalada | Unsplash | https://images.unsplash.com/photo-1544620347-c4fd4a3d5957 |
| `phero-cabs` | Yellow taxi cab on a city road during daytime | Nick Fewings | Unsplash | https://images.unsplash.com/photo-1628947733273-cdae71c9bfd3 |
| `phero-holidays` | Tropical seashore at golden hour | Sean Oulashin | Unsplash | https://images.unsplash.com/photo-1507525428034-b723cf961d3e |
| `phero-homestays` | Modern villa living space | Roberto Nickson | Unsplash | https://images.unsplash.com/photo-1512917774080-9991f1c4c750 |
| `phero-cruise` | Aerial view of cruise ships docked on blue water | Fernando Jorge | Unsplash | https://images.unsplash.com/photo-1548574505-5e239809ee19 |
| `phero-forex` | Assorted foreign currency banknotes on a wooden table | Phillip Flores | Unsplash | https://images.unsplash.com/photo-1700394474173-6428c2ea061c |
| `phero-insurance` | Documents and paperwork on a desk | Scott Graham | Unsplash | https://images.unsplash.com/photo-1454165804606-c3d57bc86b40 |
| `phero-tours` | Sightseeing landmark on a guided tour | Sagar Dani | Unsplash | https://images.unsplash.com/photo-1513622470522-26c3c8a854bc |
| `phero-visa` | Passports laid out for international travel | Jon Tyson | Unsplash | https://images.unsplash.com/photo-1532995092664-7027dcede29f |

**Where used**

- `hero-home` - Home page hero (Hero.css .hero-bg, HomePage.css .hp-hero)
- `hero-login` - Login / Sign-up page panel + mobile hero (LoginPage.css)
- `phero-flights` - Flights page hero banner (FlightsPage.jsx)
- `phero-hotels` - Hotels page hero (InnerPages.css .phero.hotels)
- `phero-trains` - Trains page hero (InnerPages.css .phero.trains)
- `phero-buses` - Buses page hero (InnerPages.css .phero.buses)
- `phero-cabs` - Cabs page hero (InnerPages.css .phero.cabs)
- `phero-holidays` - Holiday Packages hero (InnerPages.css .phero.holidays)
- `phero-homestays` - Villas & Homestays hero (InnerPages.css .phero.homestays)
- `phero-cruise` - Cruise page hero + featured card (InnerPages.css, CruisePage.jsx)
- `phero-forex` - Forex Card & Currency hero (InnerPages.css .phero.forex)
- `phero-insurance` - Travel Insurance hero + plan card (InnerPages.css, InsurancePage.jsx)
- `phero-tours` - Tours & Attractions hero + featured tour (InnerPages.css, ToursPage.jsx)
- `phero-visa` - Visa page hero (InnerPages.css .phero.visa)

## Flight Module

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `flight-airplane` | White commercial airplane in mid air | John McArthur | Unsplash | https://images.unsplash.com/photo-1569629743817-70d8db6c323b |
| `flight-terminal` | Passengers walking through an airport terminal hallway | Joseph Barrientos | Unsplash | https://images.unsplash.com/photo-1596226004757-09d33a19ea5d |
| `flight-boarding-gate` | Travellers walking to the boarding gate with luggage | Edwin Petrus | Unsplash | https://images.unsplash.com/photo-1730288510932-f6cdf35934ac |
| `flight-cabin` | Airline cabin interior with blue seats | Lukas Souza | Unsplash | https://images.unsplash.com/photo-1636699811128-1a83547b76d5 |
| `flight-cabin-aisle` | View down the aisle of a commercial airplane cabin | Alexander Van Steenberge | Unsplash | https://images.unsplash.com/photo-1760097776528-6f6a78110a0f |
| `flight-runway` | White airliner on the runway | Ivan Shimko | Unsplash | https://images.unsplash.com/photo-1524592714635-d77511a4834d |
| `flight-passenger` | Passenger waiting at the airport watching an airplane | JESHOOTS.COM | Unsplash | https://images.unsplash.com/photo-1530521954074-e64f6810b32d |
| `flight-jetbridge` | Airplane parked at the terminal jet bridge | Oskar Kadaksoo | Unsplash | https://images.unsplash.com/photo-1553619948-505cc1cdc320 |
| `flight-terminal-window` | Sunset through the windows of an airport terminal | Safwan Mahmud | Unsplash | https://images.unsplash.com/photo-1570114581742-586696237de1 |

**Where used**

- `flight-airplane` - Home offers strip, airline partners, Flights module
- `flight-terminal` - Flights page "Flying With Us" gallery
- `flight-boarding-gate` - Flights page "Flying With Us" gallery
- `flight-cabin` - Flights page "Flying With Us" gallery, airline partners
- `flight-cabin-aisle` - Flights module cabin imagery
- `flight-runway` - Flights page "Flying With Us" gallery, airline partners
- `flight-passenger` - Flights page "Flying With Us" gallery
- `flight-jetbridge` - Home page bank-offer card, airline partners
- `flight-terminal-window` - Flights module terminal imagery

## Hotel Module

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `hotel-luxury-exterior` | Luxury hotel building with an infinity pool | Roberto Nickson | Unsplash | https://images.unsplash.com/photo-1561501900-3701fa6a0864 |
| `hotel-resort` | Beach resort overlooking the blue sea | Saad Khan | Unsplash | https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9 |
| `hotel-room` | Hotel room with white bed linen and throw pillows | Vojtech Bruzek | Unsplash | https://images.unsplash.com/photo-1618773928121-c32242e63f39 |
| `hotel-room-2` | Neatly made hotel bed with white linen | Point3D Commercial Imaging Ltd. | Unsplash | https://images.unsplash.com/photo-1631049307264-da0ec9d70304 |
| `hotel-room-3` | Hotel bedroom with a wooden bed frame | Sasha Kaunas | Unsplash | https://images.unsplash.com/photo-1582719478250-c89cae4dc85b |
| `hotel-suite` | Hotel suite with a sectional sofa and bed | Roberto Nickson | Unsplash | https://images.unsplash.com/photo-1578683010236-d716f9a3f461 |
| `hotel-pool` | Infinity pool at a luxury hotel | Shawn Lee | Unsplash | https://images.unsplash.com/photo-1534612899740-55c821a90129 |
| `hotel-pool-2` | Hotel pool with lounge chairs and umbrellas | Olha | Unsplash | https://images.unsplash.com/photo-1716667282993-cd8f2bffb91f |
| `hotel-lobby` | Modern hotel lobby with designer furniture | Frames For Your Heart | Unsplash | https://images.unsplash.com/photo-1621293954908-907159247fc8 |
| `hotel-reception` | Hotel reception lounge with sofas and plants | Yayaq Destination | Unsplash | https://images.unsplash.com/photo-1590447158019-883d8d5f8bc7 |
| `hotel-restaurant` | Hotel restaurant with wooden tables and chairs | Nick Karvounis | Unsplash | https://images.unsplash.com/photo-1552566626-52f8b828add9 |
| `hotel-restaurant-2` | Hotel restaurant with a waterfront view | Albert | Unsplash | https://images.unsplash.com/photo-1559339352-11d035aa65de |
| `hotel-rooftop` | Rooftop pool deck with loungers and palm trees | Christian Lambert | Unsplash | https://images.unsplash.com/photo-1549294413-26f195200c16 |
| `hotel-bathroom` | Hotel suite seating area | reisetopia | Unsplash | https://images.unsplash.com/photo-1590490360182-c33d57733427 |

**Where used**

- `hotel-luxury-exterior` - Hotels offers, hotel brands, hotel-card fallback, HotelDetailsPage gallery
- `hotel-resort` - Hotel brands, Homestays featured, HotelDetailsPage gallery
- `hotel-room` - Hotels offers, room types, HotelDetailsPage gallery, Udaipur listings
- `hotel-room-2` - HotelDetailsPage room types, Udaipur listings
- `hotel-room-3` - Homestays featured, HotelDetailsPage room types, Udaipur listings
- `hotel-suite` - Homestays featured, HotelDetailsPage gallery, Udaipur listings
- `hotel-pool` - Hotels offers, hotel brands, Udaipur listings
- `hotel-pool-2` - HotelDetailsPage gallery, Udaipur listings
- `hotel-lobby` - Hotels offers, hotel brands, top-rated hotels, Udaipur listings
- `hotel-reception` - HotelDetailsPage gallery, Udaipur listings
- `hotel-restaurant` - Hotels offers, HotelListing gallery, Udaipur listings
- `hotel-restaurant-2` - HotelDetailsPage gallery, Udaipur listings
- `hotel-rooftop` - Home "Luxury" offer card, HotelDetailsPage gallery, Udaipur listings
- `hotel-bathroom` - Udaipur listings, HotelDetailsPage gallery

## Train Module

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `train-modern` | Modern high-speed bullet train | Ryan Lu | Unsplash | https://images.unsplash.com/photo-1523667071851-4fda8c8a8dd5 |
| `train-station` | Red train at a railway station platform | Atharva Tulsi | Unsplash | https://images.unsplash.com/photo-1560521608-b4e1acca0824 |
| `train-station-india` | Train waiting alongside an Indian railway station platform | Akshob Ram Kumar | Unsplash | https://images.unsplash.com/photo-1703305669195-26d9dc1e2b2d |
| `train-platform` | Passengers waiting on a railway platform | Omkar Ambre | Unsplash | https://images.unsplash.com/photo-1658054420202-b78860cde67a |
| `train-interior` | Train coach interior with red seats | Uriel Soberanes | Unsplash | https://images.unsplash.com/photo-1509329502519-c7bec26f5808 |
| `train-coach-premium` | Premium train coach with a long row of seats | Bantar Prakoso | Unsplash | https://images.unsplash.com/photo-1684634219357-c3520cac38e0 |
| `train-track` | Train on a steel railway track | Kishore V | Unsplash | https://images.unsplash.com/photo-1637995735729-c43250f1ef47 |

**Where used**

- `train-modern` - Home trains offer, Trains offers, Trains "Travelling by rail" gallery
- `train-station` - Trains module station imagery
- `train-station-india` - Trains page offers strip
- `train-platform` - Trains gallery, Trains offers, Train booking success header
- `train-interior` - Trains "Travelling by rail" gallery
- `train-coach-premium` - Trains "Travelling by rail" gallery, Trains offers
- `train-track` - Trains module route imagery

## Bus Module

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `bus-volvo` | Parked blue and black long-distance coach | Jonathan Borba | Unsplash | https://images.unsplash.com/photo-1570125909232-eb263c188f7e |
| `bus-luxury` | Luxury coach bus on a mountain road | Juan Encalada | Unsplash | https://images.unsplash.com/photo-1544620347-c4fd4a3d5957 |
| `bus-coach` | Grey and black coach bus parked during daytime | Jonathan Borba | Unsplash | https://images.unsplash.com/photo-1570125909517-53cb21c89ff2 |
| `bus-tour` | White and black intercity bus on the road during daytime | Jalal Kelink | Unsplash | https://images.unsplash.com/photo-1605068263928-dc295689add1 |
| `bus-interior` | Padded reclining bus seats | CHUTTERSNAP | Unsplash | https://images.unsplash.com/photo-1532939163844-547f958e91b4 |
| `bus-interior-2` | Interior aisle of a passenger bus | Krišjānis Kazaks | Unsplash | https://images.unsplash.com/photo-1656501029164-d1fefd9689f9 |
| `bus-terminal` | Modern bus terminal with passengers | viktor rejent | Unsplash | https://images.unsplash.com/photo-1778341455173-d4596470e22f |
| `bus-passengers` | Passengers riding a long-distance bus during daytime | Ash Gerlach | Unsplash | https://images.unsplash.com/photo-1509749837427-ac94a2553d0e |

**Where used**

- `bus-volvo` - Buses page fleet card
- `bus-luxury` - Home bus offer card, Buses page hero + fleet card
- `bus-coach` - Buses module fleet imagery
- `bus-tour` - Buses module fleet imagery
- `bus-interior` - Buses page fleet card (sleeper interior)
- `bus-interior-2` - Buses module interior imagery
- `bus-terminal` - Buses module terminal imagery
- `bus-passengers` - Buses module passenger imagery

## Cab Module

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `cab-sedan` | Black sedan car | Arteum.ro | Unsplash | https://images.unsplash.com/photo-1546614042-7df3c24c9e5d |
| `cab-sedan-2` | Premium crossover car on the road during daytime | Maksym Tymchyk | Unsplash | https://images.unsplash.com/photo-1615063029891-497bebd4f03c |
| `cab-suv` | Parked white SUV | Sven D | Unsplash | https://images.unsplash.com/photo-1533473359331-0135ef1b58bf |
| `cab-suv-2` | White SUV on a grey floor | Tabea Schimpf | Unsplash | https://images.unsplash.com/photo-1519641471654-76ce0107ad1b |
| `cab-taxi` | Yellow taxi cab on a city road | Nick Fewings | Unsplash | https://images.unsplash.com/photo-1628947733273-cdae71c9bfd3 |
| `cab-taxi-night` | Taxi cab on the road at night | JavyGo | Unsplash | https://images.unsplash.com/photo-1610886023290-6ba32b20e354 |
| `cab-chauffeur` | Chauffeur driving a car | Rolando Garrido | Unsplash | https://images.unsplash.com/photo-1615563164538-89e1da13fcc4 |
| `cab-interior` | Clean rear seats inside a car | Arteum.ro | Unsplash | https://images.unsplash.com/photo-1547731269-e4073e054f12 |

**Where used**

- `cab-sedan` - Cabs page vehicle card, Cab search results, image fallback
- `cab-sedan-2` - Cabs module premium vehicle imagery
- `cab-suv` - Cabs page vehicle card
- `cab-suv-2` - Cab search results (SUV tier)
- `cab-taxi` - Home cabs offer card, Cabs page hero
- `cab-taxi-night` - Cabs module airport-taxi imagery
- `cab-chauffeur` - Cabs module chauffeur imagery
- `cab-interior` - Cabs page vehicle card, Cab search results (premium tier)

## Destination Photography

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `dest-goa` | Blue sea under a sunny sky in Goa | alexey turenkov | Unsplash | https://images.unsplash.com/photo-1512343879784-a960bf40e7f2 |
| `dest-jaipur` | Hawa Mahal palace in Jaipur, India | Annie Spratt | Unsplash | https://images.unsplash.com/photo-1524230507669-5ff97982bb5e |
| `dest-delhi` | India Gate arch in Delhi under a blue sky | shalender kumar | Unsplash | https://images.unsplash.com/photo-1587474260584-136574528ed5 |
| `dest-mumbai` | Sea bridge in Mumbai during golden hour | Sid Saxena | Unsplash | https://images.unsplash.com/photo-1562979314-bee7453e911c |
| `dest-udaipur` | Boat on the lake beside a palace in Udaipur | Jainam Mehta | Unsplash | https://images.unsplash.com/photo-1615836245337-f5b9b2303f10 |
| `dest-manali` | Aerial view of a town near snow-covered mountains in Manali | Tejj | Unsplash | https://images.unsplash.com/photo-1606667544139-81e47935d769 |
| `dest-shimla` | Hillside town of Shimla under a blue sky | Naman Pandey | Unsplash | https://images.unsplash.com/photo-1597074866923-dc0589150358 |
| `dest-kerala` | Houseboat on the Kerala backwaters | Nature Photographer | Unsplash | https://images.unsplash.com/photo-1602216056096-3b40cc0c9944 |
| `dest-kashmir` | Wooden houseboat on a lake below snow-capped mountains in Kashmir | Isa | Unsplash | https://images.unsplash.com/photo-1595815771614-ade9d652a65d |
| `dest-dubai` | Aerial view of a Dubai highway surrounded by high-rise buildings | David Rodrigo | Unsplash | https://images.unsplash.com/photo-1512453979798-5ea266f8880c |
| `dest-singapore` | Marina Bay Sands in Singapore | Hu Chen | Unsplash | https://images.unsplash.com/photo-1525625293386-3f8f99389edd |
| `dest-bali` | Temple beside water and trees in Bali | Aron Visuals | Unsplash | https://images.unsplash.com/photo-1537996194471-e657df975ab4 |
| `dest-maldives` | Aerial view of overwater resort villas in the Maldives | Rayyu Maldives | Unsplash | https://images.unsplash.com/photo-1573843981267-be1999ff37cd |
| `dest-thailand` | Orange temples in Thailand during daytime | Alejandro Cartagena | Unsplash | https://images.unsplash.com/photo-1563492065599-3520f775eeed |
| `dest-ladakh` | Lake surrounded by mountains in Ladakh | Prabhav Kashyap Godavarthy | Unsplash | https://images.unsplash.com/photo-1619837374214-f5b9eb80876d |
| `dest-rishikesh` | Suspension bridge over the river at Rishikesh | Niloy Banerjee | Unsplash | https://images.unsplash.com/photo-1720819029162-8500607ae232 |
| `dest-andaman` | Palm trees on a white sand beach in the Andamans | tatonomusic | Unsplash | https://images.unsplash.com/photo-1586359716568-3e1907e4cf9f |
| `dest-bengaluru` | High-rise city buildings during daytime | Hardik Joshi | Unsplash | https://images.unsplash.com/photo-1573132223210-d65883b944aa |
| `dest-ooty` | Green pine trees on a hillside during daytime | Dhara Prajapati | Unsplash | https://images.unsplash.com/photo-1565610468500-adc61f362be5 |
| `dest-auli` | Snow-covered mountain during daytime | Alik Ghosh | Unsplash | https://images.unsplash.com/photo-1616942986550-ea6469c08530 |
| `dest-saputara` | River running through a lush green forest | Akshay syal | Unsplash | https://images.unsplash.com/photo-1675515642093-4fd5b6cca657 |
| `dest-mandarmani` | Beach with a fishing boat and trees | Zoshua Colah | Unsplash | https://images.unsplash.com/photo-1727499031382-407906c7e208 |
| `dest-northeast` | Snowy field with trees and mountains | Hrishikesh Sarode | Unsplash | https://images.unsplash.com/photo-1692719058797-2954b100c8fe |
| `dest-hills` | Hill town nestled in a mountain range | Raghav Goyal | Unsplash | https://images.unsplash.com/photo-1634539132466-abaca3a2438b |

**Where used**

- `dest-goa` - Home destinations + picks, Hotels/Holidays destination cards, offers
- `dest-jaipur` - Home destinations, Hotels/Holidays destination cards, picks
- `dest-delhi` - Home collections, Hotels popular destinations
- `dest-mumbai` - Home collections, Hotels popular destinations
- `dest-udaipur` - Home destinations, Udaipur listing galleries, top-rated hotels
- `dest-manali` - Home destinations, Hotels/Holidays destination cards
- `dest-shimla` - Home collections + wonders, Homestays, Holidays
- `dest-kerala` - Home destinations + editors pick, Holidays packages
- `dest-kashmir` - Destination photography set
- `dest-dubai` - Login page destination card, Holidays packages
- `dest-singapore` - Destination photography set
- `dest-bali` - Login page destination card, Holidays packages
- `dest-maldives` - Login page destination card, Holidays packages
- `dest-thailand` - Holidays packages
- `dest-ladakh` - Home destinations, Hotels destination card, Holiday themes
- `dest-rishikesh` - Home destinations + wellness pick, Holiday themes
- `dest-andaman` - Home destinations, Cruise page card
- `dest-bengaluru` - Home collections (Bengaluru weekend stays)
- `dest-ooty` - Home lesser-known wonders, Homestays featured
- `dest-auli` - Home lesser-known wonders
- `dest-saputara` - Home lesser-known wonders, Holiday themes
- `dest-mandarmani` - Home lesser-known wonders
- `dest-northeast` - Home editors picks (Northeast escapes)
- `dest-hills` - Home collections (weekend getaways)

## Booking Confirmation, Empty & Error States

| Asset | Subject | Photographer | Source | Original photo URL |
|-------|---------|--------------|--------|--------------------|
| `state-success` | Passport and boarding pass resting on a travel bag | CardMapr.nl | Unsplash | https://images.unsplash.com/photo-1586441133374-ed1cb4007a47 |
| `state-success-2` | Traveller holding a passport beside an airplane window | Blake Guidry | Unsplash | https://images.unsplash.com/photo-1530469525856-cf37954301f7 |
| `state-empty-trips` | Traveller reading the flight schedule board at an airport | Anete Lūsiņa | Unsplash | https://images.unsplash.com/photo-1522199873717-bc67b1a5e32b |
| `state-error` | Traveller walking through an airport concourse | Sergey Zolkin | Unsplash | https://images.unsplash.com/photo-1549894595-4698795b38ee |
| `state-no-results` | Traveller holding passports and travel documents | Spencer Davis | Unsplash | https://images.unsplash.com/photo-1553697388-94e804e2f0f6 |

**Where used**

- `state-success` - Booking confirmation headers (flight, hotel, cab), payment gateway logo
- `state-success-2` - Booking confirmation imagery
- `state-empty-trips` - My Trips empty state, generic EmptyState, Company page
- `state-error` - ErrorState component
- `state-no-results` - NoResultsState component

## Verification

- Every photograph was visually inspected after download to confirm it is a real
  photograph (not a vector, illustration, render or AI image) and matches its subject.
- All 384 generated files were confirmed to resolve over HTTP from the production build.
- Rendering was checked at desktop (1440x900), tablet (834x1112) and mobile (390x844)
  across 16 routes, with zero broken images reported by the browser.
