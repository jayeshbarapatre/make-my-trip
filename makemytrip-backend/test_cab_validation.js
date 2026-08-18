import { validateProfile } from './src/services/cabProfile.js'

const body = {
  operatorName: 'Speed Cab',
  cabNumber: 'MH-12-AB-9876',
  type: 'Economy',
  available: 1,
  baseFare: 200,
  perKmRate: 20,
  perMinuteRate: 1,
  from: 'Indore',
  to: 'Baroda'
}

console.log('Validating with partial: true ->', validateProfile(body, { partial: true }))
console.log('Validating with partial: false ->', validateProfile(body, { partial: false }))
