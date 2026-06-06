const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  isActive: Boolean,
  refreshToken: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function checkDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';
  console.log('Connecting to:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  const users = await User.find({});
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    console.log(`User: ${u.firstName} ${u.lastName} (${u.email})`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Active: ${u.isActive}`);
    console.log(`  _id: ${u._id}`);
    console.log(`  refreshToken: ${u.refreshToken ? u.refreshToken.substring(0, 30) + '...' : 'null'}`);
  }

  await mongoose.disconnect();
}

checkDB().catch(console.error);
