const mongoose = require('mongoose');

const connectDB =async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MONGODB connected');
    }catch(error){
        console.error('MONGO conenction failed: ', error.message);
    }
};

module.exports = connectDB;