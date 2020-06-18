var serialport = require("serialport"); 
var SerialPort = serialport.SerialPort; 

var com = new SerialPort(COM1, {
    baudRate: 9600,
    databits: 8,
    parity: 'none'
}, false);

com.open(function (error) {
    if (error) {
        console.log('Error while opening the port ' + error);
    } else {
        console.log('CST port open');
        com.write(1, function (err, result) {
            if (err) {
                console.log('Error while sending message : ' + err);
            }
            if (result) {
                console.log('Response received after sending message : ' + result);
            }    
        });
    }              
});