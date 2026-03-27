require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.collection('users').updateMany(
    { emailVerified: false },
    { $set: { emailVerified: true } }
  )
  console.log(`Corrigidos: ${result.modifiedCount} usuários`)
  process.exit(0)
}).catch(err => { console.error(err); process.exit(1) })
