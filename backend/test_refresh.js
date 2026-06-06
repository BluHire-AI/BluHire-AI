const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key-fallback';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-fallback';

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  isActive: Boolean,
  refreshToken: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function testRefresh() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB Connected');

  const user = await User.findOne({ refreshToken: { $ne: null } });
  if (!user) {
    console.log('No user with a refresh token found.');
    await mongoose.disconnect();
    return;
  }

  const token = user.refreshToken;

  console.log('Trying with JWT_REFRESH_SECRET:', JWT_REFRESH_SECRET);
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    console.log('SUCCESS with JWT_REFRESH_SECRET!');
  } catch (e) {
    console.log('FAILED with JWT_REFRESH_SECRET:', e.message);
  }

  console.log('Trying with JWT_ACCESS_SECRET:', JWT_ACCESS_SECRET);
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    console.log('SUCCESS with JWT_ACCESS_SECRET!');
  } catch (e) {
    console.log('FAILED with JWT_ACCESS_SECRET:', e.message);
  }

  await mongoose.disconnect();
}

testRefresh().catch(console.error);
