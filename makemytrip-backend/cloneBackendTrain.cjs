const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const filesToClone = [
  { src: 'controllers/vendorBusController.js', dest: 'controllers/vendorTrainController.js' },
  { src: 'controllers/busAdminController.js', dest: 'controllers/trainAdminController.js' },
  { src: 'controllers/adminBusApprovalController.js', dest: 'controllers/adminTrainApprovalController.js' }
];

function replaceContent(content) {
  let newContent = content;
  // Case sensitive replaces first
  newContent = newContent.replace(/VendorBuses/g, 'VendorTrains');
  newContent = newContent.replace(/AdminBuses/g, 'AdminTrains');
  newContent = newContent.replace(/busController/g, 'trainController');
  newContent = newContent.replace(/vendorBusController/g, 'vendorTrainController');
  newContent = newContent.replace(/busAdminController/g, 'trainAdminController');
  newContent = newContent.replace(/adminBusApprovalController/g, 'adminTrainApprovalController');
  
  newContent = newContent.replace(/Bus/g, 'Train');
  newContent = newContent.replace(/bus/g, 'train');
  newContent = newContent.replace(/buses/g, 'trains');
  newContent = newContent.replace(/Buses/g, 'Trains');
  
  return newContent;
}

filesToClone.forEach(file => {
  const srcPath = path.join(srcDir, file.src);
  if (!file.modifyOnly) {
    const destPath = path.join(srcDir, file.dest);
    if (fs.existsSync(srcPath)) {
      const content = fs.readFileSync(srcPath, 'utf8');
      const newContent = replaceContent(content);
      fs.writeFileSync(destPath, newContent);
      console.log(`Cloned ${file.src} to ${file.dest}`);
    }
  }
});
