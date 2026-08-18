import { db } from './src/config/firebase.js'
import { isSellable } from './src/config/cabModel.js'

async function check() {
  const snap = await db.collection('cabs').get()
  const cabs = snap.docs.map(d => ({id: d.id, ...d.data()}))
  console.log('Total cabs:', cabs.length)
  const indore = cabs.filter(c => c.from === 'Indore' || c.fromCanonical === 'indore')
  console.log('Indore cabs:', JSON.stringify(indore, null, 2))
  for (const c of indore) {
    console.log(`Cab ${c.id}: isSellable? ${isSellable(c)}`)
  }
}
check()
