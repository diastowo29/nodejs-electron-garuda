const Sequelize = require('sequelize')
const rfidModel = require('./models/rfid')

var sequelize_db;

if (process.env.DATABASE_URL === undefined) {
	sequelize_db = new Sequelize('atm_beras', '46overspeed', '46Password', {
	  host: 'localhost',
	  dialect: 'mysql'
	});
} else {
	sequelize_db = new Sequelize(process.env.DATABASE_URL, {
	  dialectOptions: {
	    ssl: {
	      require: true,
	      rejectUnauthorized: false,
	    },
	    keepAlive: true,        
	  },      
	  ssl: true
	})
}


const rfid_table = rfidModel(sequelize_db, Sequelize)

sequelize_db.sync()
  .then(() => {
    console.log(`Database & tables created!`)
    })

module.exports = {
    rfid_table
}