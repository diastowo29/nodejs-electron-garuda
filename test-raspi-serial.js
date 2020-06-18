const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;

var stringToSerial = Buffer.from('kucing', 'utf8');

raspi.init(() => {
  var serial = new Serial({
  	portId: "/dev/ttyACM0"
  });
  serial.open(() => {
    serial.on('data', (data) => {
      process.stdout.write(data);
    });
    serial.write("stringToSerial", (datasent) => {
    	console.log(datasent)
    });
  });
});