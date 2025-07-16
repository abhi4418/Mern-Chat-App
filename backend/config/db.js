const mongoose = require('mongoose') ;

const connectDB = async ()=>{
    try {
        const conn = mongoose.connect(process.env.MONGO_URL)
    }
    catch(error){
        console.log(error.message);
        process.exit() ;
    }
}

module.exports = connectDB;