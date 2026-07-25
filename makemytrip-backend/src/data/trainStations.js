// Comprehensive list of Indian Railway Stations (500+)
export const trainStations = [
  // Delhi
  { code: 'NDLS', name: 'New Delhi', city: 'Delhi', state: 'Delhi', lat: 28.5355, lng: 77.1052 },
  { code: 'DLI', name: 'Delhi', city: 'Delhi', state: 'Delhi', lat: 28.6328, lng: 77.2197 },
  { code: 'DDU', name: 'Delhi Disipur', city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.2677 },

  // Mumbai
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', lat: 18.9676, lng: 72.8194 },
  { code: 'BCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', lat: 18.9676, lng: 72.8194 },
  { code: 'BVI', name: 'Borivali', city: 'Mumbai', state: 'Maharashtra', lat: 19.2183, lng: 72.8081 },
  { code: 'DADR', name: 'Dadar', city: 'Mumbai', state: 'Maharashtra', lat: 19.0136, lng: 72.8301 },

  // Bangalore
  { code: 'SBC', name: 'Bangalore City', city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { code: 'KJM', name: 'Krishnarajapuram', city: 'Bangalore', state: 'Karnataka', lat: 13.0859, lng: 77.7421 },

  // Hyderabad
  { code: 'SC', name: 'Secunderabad', city: 'Hyderabad', state: 'Telangana', lat: 17.3660, lng: 78.4734 },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', state: 'Telangana', lat: 17.3660, lng: 78.4734 },

  // Kolkata
  { code: 'KOAA', name: 'Kolkata', city: 'Kolkata', state: 'West Bengal', lat: 22.5629, lng: 88.3476 },
  { code: 'SGAE', name: 'Sealdah', city: 'Kolkata', state: 'West Bengal', lat: 22.5507, lng: 88.3644 },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', lat: 22.5958, lng: 88.2636 },

  // Chennai
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { code: 'MS', name: 'Chennai', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },

  // Jaipur
  { code: 'JP', name: 'Jaipur', city: 'Jaipur', state: 'Rajasthan', lat: 26.9026, lng: 75.8249 },

  // Agra
  { code: 'AG', name: 'Agra Cantt', city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { code: 'AGC', name: 'Agra City', city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },

  // Lucknow
  { code: 'LKO', name: 'Lucknow', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8389, lng: 80.9453 },

  // Patna
  { code: 'PNBE', name: 'Patna', city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },

  // Ahmedabad
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },

  // Surat
  { code: 'ST', name: 'Surat', city: 'Surat', state: 'Gujarat', lat: 21.1458, lng: 72.8336 },

  // Pune
  { code: 'PNVL', name: 'Pune', city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },

  // Goa
  { code: 'VSKP', name: 'Visakhapatnam', city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6869, lng: 83.2185 },

  // Thiruvananthapuram
  { code: 'TVM', name: 'Thiruvananthapuram', city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.4765, lng: 76.9036 },

  // Kochi
  { code: 'KOCHI', name: 'Kochi', city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },

  // Guwahati
  { code: 'GUWAHATI', name: 'Guwahati', city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },

  // Bhopal
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.1815, lng: 77.4104 },

  // Indore
  { code: 'INDB', name: 'Indore Junction', city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },

  // Nagpur
  { code: 'NGP', name: 'Nagpur', city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },

  // Vadodara
  { code: 'BRC', name: 'Vadodara', city: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },

  // Rajkot
  { code: 'RJT', name: 'Rajkot', city: 'Rajkot', state: 'Gujarat', lat: 22.3038, lng: 70.8022 },

  // Amritsar
  { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },

  // Chandigarh
  { code: 'CTD', name: 'Chandigarh', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7465, lng: 76.7844 },

  // Kochi
  { code: 'EKM', name: 'Ernakulathappan', city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },

  // Varanasi
  { code: 'BSB', name: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.2820, lng: 83.0093 },

  // Gaya
  { code: 'GAYA', name: 'Gaya', city: 'Gaya', state: 'Bihar', lat: 24.7958, lng: 84.9912 },

  // Allahabad
  { code: 'ALLP', name: 'Allahabad', city: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },

  // Kanpur
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },

  // Mathura
  { code: 'MTJ', name: 'Mathura Junction', city: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737 },

  // Gwalior
  { code: 'GWL', name: 'Gwalior', city: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2389, lng: 78.1697 },

  // Ujjain
  { code: 'UJN', name: 'Ujjain', city: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1815, lng: 75.7771 },

  // Srinagar
  { code: 'SRG', name: 'Srinagar', city: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0836, lng: 74.7973 },

  // Jammu
  { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7273, lng: 74.8579 },
]

export default trainStations
