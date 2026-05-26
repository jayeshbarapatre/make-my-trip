const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const filesToClone = [
  { src: 'pages/VendorBuses.jsx', dest: 'pages/VendorTrains.jsx' },
  { src: 'components/Vendor/VendorBusForm.jsx', dest: 'components/Vendor/VendorTrainForm.jsx' },
  { src: 'pages/AdminBuses.jsx', dest: 'pages/AdminTrains.jsx' },
  { src: 'pages/AdminBusApprovals.jsx', dest: 'pages/AdminTrainApprovals.jsx' }
];

function replaceContent(content) {
  let newContent = content;
  // Case sensitive replaces first
  newContent = newContent.replace(/VendorBuses/g, 'VendorTrains');
  newContent = newContent.replace(/VendorBusForm/g, 'VendorTrainForm');
  newContent = newContent.replace(/vendorBusesService/g, 'vendorTrainsService');
  newContent = newContent.replace(/AdminBuses/g, 'AdminTrains');
  newContent = newContent.replace(/AdminBusApprovals/g, 'AdminTrainApprovals');
  newContent = newContent.replace(/adminBusesService/g, 'adminTrainsService');
  newContent = newContent.replace(/approveBus/g, 'approveTrain');
  newContent = newContent.replace(/rejectBus/g, 'rejectTrain');
  newContent = newContent.replace(/getPendingBuses/g, 'getPendingTrains');
  newContent = newContent.replace(/Bus/g, 'Train');
  newContent = newContent.replace(/busId/g, 'trainId');
  newContent = newContent.replace(/buses/g, 'trains');
  newContent = newContent.replace(/Buses/g, 'Trains');
  newContent = newContent.replace(/bus/g, 'train');
  
  // Custom tweaks for forms
  newContent = newContent.replace(/Operator Name/gi, 'Operator/Railway');
  newContent = newContent.replace(/Bus Type/gi, 'Train Type');
  newContent = newContent.replace(/Total Seats/gi, 'Total Coaches');
  
  return newContent;
}

filesToClone.forEach(file => {
  const srcPath = path.join(srcDir, file.src);
  const destPath = path.join(srcDir, file.dest);
  
  if (fs.existsSync(srcPath)) {
    const content = fs.readFileSync(srcPath, 'utf8');
    const newContent = replaceContent(content);
    fs.writeFileSync(destPath, newContent);
    console.log(`Cloned ${file.src} to ${file.dest}`);
  } else {
    console.error(`Source file not found: ${file.src}`);
  }
});
