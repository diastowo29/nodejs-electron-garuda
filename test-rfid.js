const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");

const softSPI = new SoftSPI({
  clock: 23, // 23 pin number of SCLK
  mosi: 19, // 19 pin number of MOSI
  miso: 21, // 21 pin number of MISO
  client: 24 // 24 pin number of CS
});

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
// I believe that channing pattern is better for configuring pins which are optional methods to use.
const mfrc522 = new Mfrc522(softSPI).setResetPin(22);

// watchHCSR04();
setInterval(function() {
  //# reset card
  mfrc522.reset();


  //# Scan for cards
  let response = mfrc522.findCard();
  if (!response.status) {
    // console.log("No Card");
    return;
  }
  console.log("Card detected, CardType: " + response.bitSize);

  //# Get the UID of the card
  response = mfrc522.getUid();
  if (!response.status) {
    console.log("UID Scan Error");
    return;
  }
  const uid = response.data;
  console.log(
    "Card read UID: %s %s %s %s",
    uid[0].toString(16),
    uid[1].toString(16),
    uid[2].toString(16),
    uid[3].toString(16)
  );

  //# Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uid);
  console.log("Card Memory Capacity: " + memoryCapacity);

  //# This is the default key for authentication
  const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

  var blockIndexes = [1, 4];
  var isAdmin = false;

  for (var i=0; i<blockIndexes.length; i++) {
    if (!mfrc522.authenticate(blockIndexes[i], key, uid)) {
      console.log("Authentication Error");
      return;
    }

    let bufferOriginal = Buffer.from(mfrc522.getDataForBlock(blockIndexes[i]));

    console.log("Block: " + blockIndexes[i] + " Data: " + bufferOriginal.toString('utf8'));

    // if (blockIndexes[i] == 1) {
    //   if (bufferOriginal.toString('utf8').includes("admn")) {
    //     console.log('this is admin')
    //     isAdmin = true
    //     mainWindow.webContents.send('role-data', "admin");
    //   } else {
    //     console.log('this is not admin')
    //     mainWindow.webContents.send('role-data', "user");
    //     isAdmin = false
    //   }
    // }


    // if (blockIndexes[i] == 4) {
    //   if (!isAdmin) {
    //     if (berasRemain > 50) {
    //       mainWindow.webContents.send('alert', 'beras-alert');
    //     } else {
    //       mainWindow.webContents.send('store-data', bufferOriginal.toString('utf8'));
    //       var intKuota = parseInt(bufferOriginal.toString('utf8'), 10);
    //       var jatahSubs = parseInt(beras);

    //       if (intKuota > jatahSubs) {
    //         console.log('cukup')
    //         var newKuota = intKuota - jatahSubs;
    //         mfrc522.writeDataToBlock(4, newData)
    //         var buf = Buffer.from(newKuota.toString(), 'utf8');
            
    //         console.log("STEPPER ROTATING");
    //         pinEnable.writeSync(0)
    //         pinDir.writeSync(1)
    //         for (var i=0; i<(jatahSubs*200); i++) {
    //           pinPulse.writeSync(1);
    //           wait(10)
    //           pinPulse.writeSync(0)
    //           wait(10)
    //         }

    //       } else {
    //         mainWindow.webContents.send('alert', 'alert');
    //         console.log('kurang')
    //       }
    //       var newData = [];

    //       for (var i=0; i<buf.length; i++) {
    //         newData.push(buf[i])
    //       }
    //     }
    //   }
    // }

  }

  //# Stop
  mfrc522.stopCrypto();
}, 500);