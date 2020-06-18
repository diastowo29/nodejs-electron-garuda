const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
 
raspi.init(() => {
  var serial = new Serial({
  	portId: "/dev/ttyACM0"
  });
  serial.open(() => {
    serial.on('data', (data) => {
      process.stdout.write(data);
    });
    serial.write('a', (datasent) => {
    	console.log(datasent)
    });
  });
});