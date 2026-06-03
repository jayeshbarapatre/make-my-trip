import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const cmsPages = [
  {
    title: 'About Company',
    slug: 'company',
    metaTitle: 'About MakeMyTrip - Company',
    metaDescription: 'Learn about MakeMyTrip, India\'s leading online travel company',
    metaKeywords: 'about, company, travel, makemytrip',
    shortDescription: 'India\'s leading online travel company since 2000',
    content: `
      <style>
        .company-hero {
          background: linear-gradient(135deg, #003580 0%, #001f4d 100%);
          color: white;
          padding: 60px 40px;
          border-radius: 12px;
          margin-bottom: 40px;
          text-align: center;
        }
        .company-hero h1 {
          font-size: 48px;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .company-hero p {
          font-size: 20px;
          line-height: 1.8;
          max-width: 600px;
          margin: 0 auto;
        }
        .company-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 40px 0;
        }
        .stat-card {
          background: #f5f5f5;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid #003580;
        }
        .stat-number {
          font-size: 36px;
          font-weight: bold;
          color: #003580;
          margin-bottom: 10px;
        }
        .stat-label {
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }
        .company-section {
          margin: 50px 0;
        }
        .company-section h2 {
          font-size: 32px;
          color: #003580;
          margin-bottom: 20px;
          border-bottom: 3px solid #1a73e8;
          padding-bottom: 10px;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .service-card {
          background: white;
          border: 1px solid #ddd;
          padding: 25px;
          border-radius: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .service-card:hover {
          box-shadow: 0 4px 16px rgba(0,53,128,0.15);
          transform: translateY(-4px);
        }
        .service-icon {
          font-size: 32px;
          margin-bottom: 15px;
        }
        .service-card h3 {
          color: #003580;
          margin: 10px 0;
          font-size: 18px;
        }
        .service-card p {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 25px;
          margin-top: 20px;
        }
        .value-card {
          background: linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%);
          padding: 30px;
          border-radius: 8px;
          border-left: 4px solid #003580;
          text-align: center;
        }
        .value-card h3 {
          color: #003580;
          margin: 10px 0;
          font-weight: 600;
        }
        .value-card p {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        .team-section {
          background: #f9f9f9;
          padding: 40px;
          border-radius: 8px;
          margin: 40px 0;
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
          margin-top: 30px;
        }
        .team-member {
          text-align: center;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .member-avatar {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #003580 0%, #1a73e8 100%);
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 40px;
          font-weight: bold;
        }
        .member-name {
          font-weight: 600;
          color: #003580;
          margin: 10px 0 5px;
        }
        .member-role {
          color: #666;
          font-size: 14px;
        }
        .cta-section {
          background: linear-gradient(135deg, #003580 0%, #001f4d 100%);
          color: white;
          padding: 50px 40px;
          border-radius: 8px;
          text-align: center;
          margin: 40px 0;
        }
        .cta-section h2 {
          color: white;
          border-bottom: none;
          padding-bottom: 0;
          font-size: 36px;
        }
        .cta-btn {
          display: inline-block;
          background: #1a73e8;
          color: white;
          padding: 15px 40px;
          border-radius: 6px;
          text-decoration: none;
          margin-top: 20px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .cta-btn:hover {
          background: #1557b0;
          transform: scale(1.05);
        }
        ul {
          list-style-position: inside;
        }
        ul li {
          margin: 10px 0;
          color: #333;
          line-height: 1.8;
        }
      </style>

      <div class="company-hero">
        <h1>Welcome to MakeMyTrip</h1>
        <p>India's #1 Travel Company | Empowering Millions to Travel the World</p>
      </div>

      <div class="company-stats">
        <div class="stat-card">
          <div class="stat-number">50M+</div>
          <div class="stat-label">Happy Travelers</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">26+</div>
          <div class="stat-label">Years in Service</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">1M+</div>
          <div class="stat-label">Daily Bookings</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">24/7</div>
          <div class="stat-label">Customer Support</div>
        </div>
      </div>

      <div class="company-section">
        <h2>Our Story</h2>
        <p>
          Founded in 2000, MakeMyTrip revolutionized travel in India by making it easier, more affordable, and more accessible to millions.
          From humble beginnings, we've grown to become India's most trusted online travel platform, serving travelers across the globe.
        </p>
        <p>
          Today, MakeMyTrip is a one-stop destination for all travel needs - flights, hotels, trains, buses, holiday packages, and much more.
          Our mission is simple: to inspire and empower people to discover the world with confidence and convenience.
        </p>
      </div>

      <div class="company-section">
        <h2>What We Offer</h2>
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">✈️</div>
            <h3>Flight Bookings</h3>
            <p>Search and book flights across domestic and international airlines with best prices guaranteed.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🏨</div>
            <h3>Hotel Stays</h3>
            <p>Explore hotels, resorts, and homestays with exclusive deals and verified reviews.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🚂</div>
            <h3>Train Bookings</h3>
            <p>Book train tickets across Indian Railways with instant confirmation.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🚌</div>
            <h3>Bus Services</h3>
            <p>Book comfortable buses for intercity and local travel.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🚗</div>
            <h3>Cab Rentals</h3>
            <p>Affordable and reliable cab services for your local travel needs.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🎒</div>
            <h3>Holiday Packages</h3>
            <p>Curated travel packages for unforgettable vacation experiences.</p>
          </div>
        </div>
      </div>

      <div class="company-section">
        <h2>Our Core Values</h2>
        <div class="values-grid">
          <div class="value-card">
            <div style="font-size: 40px; margin-bottom: 10px;">💡</div>
            <h3>Innovation</h3>
            <p>Constantly innovating to deliver cutting-edge travel solutions.</p>
          </div>
          <div class="value-card">
            <div style="font-size: 40px; margin-bottom: 10px;">🤝</div>
            <h3>Trust</h3>
            <p>Building lasting relationships with customers and partners.</p>
          </div>
          <div class="value-card">
            <div style="font-size: 40px; margin-bottom: 10px;">⭐</div>
            <h3>Excellence</h3>
            <p>Striving for excellence in every aspect of our service.</p>
          </div>
          <div class="value-card">
            <div style="font-size: 40px; margin-bottom: 10px;">🌍</div>
            <h3>Sustainability</h3>
            <p>Committed to responsible and sustainable travel practices.</p>
          </div>
        </div>
      </div>

      <div class="team-section">
        <h2 style="margin-top: 0;">Our Leadership Team</h2>
        <div class="team-grid">
          <div class="team-member">
            <div class="member-avatar">RD</div>
            <div class="member-name">Rajesh Desai</div>
            <div class="member-role">Founder & CEO</div>
          </div>
          <div class="team-member">
            <div class="member-avatar">SP</div>
            <div class="member-name">Sneha Patel</div>
            <div class="member-role">Chief Product Officer</div>
          </div>
          <div class="team-member">
            <div class="member-avatar">AK</div>
            <div class="member-name">Amit Kumar</div>
            <div class="member-role">Chief Technology Officer</div>
          </div>
          <div class="team-member">
            <div class="member-avatar">PJ</div>
            <div class="member-name">Priya Joshi</div>
            <div class="member-role">Chief Financial Officer</div>
          </div>
        </div>
      </div>

      <div class="cta-section">
        <h2>Ready to Explore the World?</h2>
        <p>Join millions of travelers who trust MakeMyTrip for their travel needs.</p>
        <a href="/" class="cta-btn">Start Your Journey Now</a>
      </div>

      <div class="company-section">
        <h2>Why Choose MakeMyTrip?</h2>
        <ul>
          <li><strong>Best Prices Guaranteed:</strong> We offer competitive pricing with price match assurance</li>
          <li><strong>Verified Reviews:</strong> Real reviews from real travelers to help you make informed decisions</li>
          <li><strong>24/7 Support:</strong> Our customer support team is available round-the-clock to assist you</li>
          <li><strong>Easy Booking:</strong> Simple and secure booking process with multiple payment options</li>
          <li><strong>Exclusive Deals:</strong> Access to exclusive offers and discounts not available elsewhere</li>
          <li><strong>Travel Insurance:</strong> Optional travel insurance to protect your journey</li>
          <li><strong>Hassle-Free Cancellations:</strong> Flexible cancellation policies for your peace of mind</li>
          <li><strong>Mobile App:</strong> Manage your bookings on the go with our feature-rich mobile app</li>
        </ul>
      </div>
    `,
    status: 'active',
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    metaTitle: 'Privacy Policy - MakeMyTrip',
    metaDescription: 'Read our privacy policy to understand how we protect your data',
    metaKeywords: 'privacy, policy, data protection',
    shortDescription: 'How we protect your personal data',
    content: `
      <h1>Privacy Policy</h1>
      <p>Last updated: June 2026</p>
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact us.</p>
      <h2>2. How We Use Your Information</h2>
      <p>We use your information to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
      <h2>3. Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information from unauthorized access.</p>
      <h2>4. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal information at any time.</p>
      <h2>5. Contact Us</h2>
      <p>For privacy-related questions, please contact us at privacy@makemytrip.com</p>
    `,
    status: 'active',
  },
  {
    title: 'Terms of Service',
    slug: 'terms-of-service',
    metaTitle: 'Terms of Service - MakeMyTrip',
    metaDescription: 'Read the terms and conditions for using MakeMyTrip',
    metaKeywords: 'terms, conditions, service agreement',
    shortDescription: 'Our terms and conditions',
    content: `
      <h1>Terms of Service</h1>
      <p>Last updated: June 2026</p>
      <h2>1. Acceptance of Terms</h2>
      <p>By using MakeMyTrip, you agree to comply with these terms and conditions.</p>
      <h2>2. Use License</h2>
      <p>Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.</p>
      <h2>3. Disclaimer</h2>
      <p>The materials on MakeMyTrip are provided on an 'as is' basis. MakeMyTrip makes no warranties, expressed or implied.</p>
      <h2>4. Limitations</h2>
      <p>In no event shall MakeMyTrip or its suppliers be liable for any damages arising out of the use of MakeMyTrip.</p>
      <h2>5. Governing Law</h2>
      <p>These terms are governed by and construed in accordance with the laws of India.</p>
    `,
    status: 'active',
  },
  {
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    metaTitle: 'Cookie Policy - MakeMyTrip',
    metaDescription: 'Learn how MakeMyTrip uses cookies',
    metaKeywords: 'cookies, policy, tracking',
    shortDescription: 'How we use cookies',
    content: `
      <h1>Cookie Policy</h1>
      <p>Last updated: June 2026</p>
      <h2>What are Cookies?</h2>
      <p>Cookies are small files that are placed on your computer or mobile device when you visit our website.</p>
      <h2>Types of Cookies We Use</h2>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for the website to function</li>
        <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our site</li>
        <li><strong>Marketing Cookies:</strong> Used to deliver personalized advertisements</li>
      </ul>
      <h2>Managing Cookies</h2>
      <p>You can control cookies through your browser settings. However, disabling cookies may affect website functionality.</p>
    `,
    status: 'active',
  },
  {
    title: 'Trust & Safety',
    slug: 'trust-safety',
    metaTitle: 'Trust & Safety - MakeMyTrip',
    metaDescription: 'MakeMyTrip commitment to trust and safety',
    metaKeywords: 'trust, safety, security',
    shortDescription: 'Your safety is our priority',
    content: `
      <h1>Trust & Safety</h1>
      <h2>Secure Payments</h2>
      <p>All transactions on MakeMyTrip are encrypted and protected by industry-standard security protocols.</p>
      <h2>Verified Partners</h2>
      <p>We only work with verified and trusted travel partners to ensure quality service.</p>
      <h2>Customer Protection</h2>
      <p>MakeMyTrip offers comprehensive protection for all bookings made through our platform.</p>
      <h2>Fraud Prevention</h2>
      <p>We employ advanced fraud detection systems to protect our customers from unauthorized transactions.</p>
      <h2>Report Issues</h2>
      <p>If you encounter any suspicious activity, please report it immediately to our support team at support@makemytrip.com</p>
    `,
    status: 'active',
  },
]

async function seedCmsPages() {
  try {
    console.log('🌱 Seeding CMS pages...')

    for (const page of cmsPages) {
      const existing = await prisma.cmsPage.findUnique({
        where: { slug: page.slug },
      })

      if (existing) {
        console.log(`✓ CMS page "${page.slug}" already exists, skipping`)
        continue
      }

      const created = await prisma.cmsPage.create({
        data: page,
      })
      console.log(`✓ Created CMS page: "${created.slug}"`)
    }

    console.log('✅ CMS pages seeding complete!')
  } catch (error) {
    console.error('❌ Error seeding CMS pages:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedCmsPages()
