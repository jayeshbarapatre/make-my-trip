const fs = require('fs');
const path = require('path');

const cssFiles = [
  'AdminFlights.css',
  'VendorBuses.css',
  'VendorFlights.css',
  'VendorHotelRooms.css',
  'VendorHotels.css'
];

cssFiles.forEach(file => {
  const p = path.join('h:/make-my-trip-practical/makemytrip-frontend/src/pages', file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/\.page-header\s*\{[^}]+\}/g, '');
    content = content.replace(/\.page-header\s+h1\s*\{[^}]+\}/g, '');
    content = content.replace(/\.page-header\s+\.subtitle\s*\{[^}]+\}/g, '');
    content = content.replace(/\.page-header\s+>\s+div\s*\{[^}]+\}/g, '');
    fs.writeFileSync(p, content);
  }
});

const globalCSSPath = 'h:/make-my-trip-practical/makemytrip-frontend/src/index.css';
let globalContent = fs.readFileSync(globalCSSPath, 'utf8');
const newStyles = `
/* Global Page Header Style */
.page-header {
  background: linear-gradient(135deg, var(--accent) 0%, #2B4DBE 100%) !important;
  border-radius: 12px !important;
  padding: 32px 24px !important;
  margin-bottom: 28px !important;
  color: white !important;
  box-shadow: var(--shadow-md) !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 1rem !important;
  position: relative;
  overflow: hidden;
}

/* Optional atmospheric circles */
.page-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
  transform: translate(30%, -30%);
  pointer-events: none;
}

.page-header h1 {
  margin: 0 0 8px 0 !important;
  font-size: 28px !important;
  font-weight: 700 !important;
  font-family: 'Space Grotesk', serif !important;
  color: white !important;
}

.page-header .subtitle {
  margin: 0 !important;
  font-size: 14px !important;
  opacity: 0.9 !important;
  color: white !important;
}
`;
if (!globalContent.includes('/* Global Page Header Style */')) {
  fs.writeFileSync(globalCSSPath, globalContent + '\n' + newStyles);
}
console.log('CSS updated successfully');
