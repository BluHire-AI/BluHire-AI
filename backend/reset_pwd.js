const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const email = 'maddilamadhuri10@gmail.com';
  const newPassword = 'password';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const res = await User.updateOne({ email }, { passwordHash: hashedPassword });
  console.log('Update result:', res);

  await mongoose.disconnect();
}

reset().catch(console.error);
