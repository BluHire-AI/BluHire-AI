const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  try {
    console.log('Connecting to MONGO_URI...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'maddilamadhuri10@gmail.com' });
    if (!user) {
      console.log('User not found.');
    } else {
      console.log('Found user details:', JSON.stringify(user, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
