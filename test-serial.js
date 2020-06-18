const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;

raspi.init(() => {
  var serial = new Serial();
  serial.open(() => {
    console.log('serial opening')
    serial.on('data', (data) => {
        console.log(data)
      process.stdout.write(data);
    });
    console.log('sending data')
    serial.write('Hello from raspi-serial');
  });
});