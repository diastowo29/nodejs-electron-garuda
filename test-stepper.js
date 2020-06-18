var Gpio = require('onoff').Gpio;
var pinEnable = new Gpio(13, 'out');
var pinDir = new Gpio(19, 'out');
var pinPulse = new Gpio(21, 'out');
const μs = require('microseconds')

/* NANO TIMER */
var NanoTimer = require('nanotimer');

var timer = new NanoTimer();

function main() {
  pinEnable.writeSync(0)
  pinDir.writeSync(1)

  timer.setInterval(stepperGo, '', '5u');
  timer.setTimeout(stepperOff, [timer], '20s');
}

function stepperGo () {

  if (pinPulse.readSync() === 0) {
    pinPulse.writeSync(1);
    console.log('1')
  } else {
    pinPulse.writeSync(0);
    console.log('0')
  }
  // console.log('pinPulse: %s', pinPulse.readSync())
}

function stepperOff () {
  timer.clearInterval();
  console.log('end process')
  pinPulse.writeSync(0);
  pinDir.writeSync(0);
  pinEnable.writeSync(1);

  console.log('pinPulse: %s', pinPulse.readSync())
  console.log('pinDir: %s', pinDir.readSync())
  console.log('pinEnable: %s', pinEnable.readSync())

  pinPulse.unexport();
  pinDir.unexport();
  pinEnable.unexport();
}

function newMain() {
  pinEnable.writeSync(0)
  pinDir.writeSync(1)
  for (var i=0; i<16000; i++) {
    pinPulse.writeSync(1);
    waitUs(500)
    pinPulse.writeSync(0);
    waitUs(500)
  }
  pinPulse.writeSync(0);
  pinDir.writeSync(0);
  pinEnable.writeSync(1);
  console.log('pinPulse: %s', pinPulse.readSync())
  console.log('pinDir: %s', pinDir.readSync())
  console.log('pinEnable: %s', pinEnable.readSync())

  pinPulse.unexport();
  pinDir.unexport();
  pinEnable.unexport();

}

// main();
newMain();


function waitUs (us) {
   var start = μs.now()
   var end = start;
   while(end < start + us) {
     end = μs.now()
  }
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}