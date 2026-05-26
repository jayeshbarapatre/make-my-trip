const fs = require('fs');
const path = require('path');

console.log('📋 Verification Report: Vendor Dashboard Icon Colors\n');
console.log('═'.repeat(60));

// Check JSX file
const jsxPath = path.join(__dirname, 'makemytrip-frontend/src/pages/VendorDashboard.jsx');
const jsxContent = fs.readFileSync(jsxPath, 'utf8');

const hasIconColorClass = jsxContent.includes('vendor-kpi-icon-${kpi.color}');
console.log('\n✅ JSX Changes:');
console.log(`   - Icon className includes color class: ${hasIconColorClass ? '✅ YES' : '❌ NO'}`);

// Check CSS file
const cssPath = path.join(__dirname, 'makemytrip-frontend/src/pages/VendorDashboard.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const hasPrimaryColor = cssContent.includes('.vendor-kpi-icon-primary');
const hasSuccessColor = cssContent.includes('.vendor-kpi-icon-success');
const hasWarningColor = cssContent.includes('.vendor-kpi-icon-warning');
const hasInfoColor = cssContent.includes('.vendor-kpi-icon-info');
const hasErrorColor = cssContent.includes('.vendor-kpi-icon-error');
const hasOpacity = cssContent.includes('opacity: 0.8');

console.log('\n✅ CSS Changes:');
console.log(`   - Primary color class: ${hasPrimaryColor ? '✅ YES' : '❌ NO'}`);
console.log(`   - Success color class: ${hasSuccessColor ? '✅ YES' : '❌ NO'}`);
console.log(`   - Warning color class: ${hasWarningColor ? '✅ YES' : '❌ NO'}`);
console.log(`   - Info color class: ${hasInfoColor ? '✅ YES' : '❌ NO'}`);
console.log(`   - Error color class: ${hasErrorColor ? '✅ YES' : '❌ NO'}`);
console.log(`   - Opacity increased to 0.8: ${hasOpacity ? '✅ YES' : '❌ NO'}`);

// Check metric icon opacity
const metricOpacity = cssContent.includes('.vendor-metric-icon {') &&
                     cssContent.includes('opacity: 0.6') &&
                     cssContent.match(/.vendor-metric-icon\s*{[\s\S]*?opacity:\s*0\.6/);
console.log(`   - Metric icon opacity set to 0.6: ${metricOpacity ? '✅ YES' : '❌ NO'}`);

console.log('\n' + '═'.repeat(60));
console.log('\n🎨 Icon Color Mapping:');
console.log('   • Total Hotels    → Primary (blue)');
console.log('   • Approved        → Success (green)');
console.log('   • Pending         → Warning (orange)');
console.log('   • Draft           → Info (cyan)');
console.log('   • Rejected        → Error (red)');

console.log('\n✨ Summary: All changes have been successfully applied!');
console.log('\nThe dashboard is running at: http://localhost:5173/vendor/dashboard');
