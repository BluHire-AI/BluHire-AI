require("dotenv").config();

// imports
const connectDB = require("./config/db");
const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

//Global CORS
app.use(cors());

// Better to use it deployment
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://your-app.vercel.app"
//     ]
//   })
// );

connectDB();

app.get('/', (req, res)=>{
    res.send("Hey it's BluHire!!");
})
app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});