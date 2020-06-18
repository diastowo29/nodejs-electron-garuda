const { app, BrowserWindow } = require('electron');
const path = require('path');
const db = require('electron-db');
var ip = require('ip');
const { rfid_table } = require('./sequelize')
const Sequelize = require('sequelize')
const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");
var Gpio = require('onoff').Gpio;
const ipcMain = require('electron').ipcMain;

// ===== SONIC =====
// const Gpio = require('pigpio').Gpio;
// const MICROSECDONDS_PER_CM = 1e6/34321;
// var distanceLeft = 0;

// const trigger = new Gpio(23, {mode: Gpio.OUTPUT});
// const echo = new Gpio(24, {mode: Gpio.INPUT, alert: true});

// console.log('watch')
// trigger.digitalWrite(0);

// let startTick;

// echo.on('alert', (level, tick) => {
//   if (level == 1) {
//     startTick = tick;
//   } else {
//     const endTick = tick;
//     const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
//     console.log(diff / 2 / MICROSECDONDS_PER_CM);
//     distanceLeft = diff / 2 / MICROSECDONDS_PER_CM;
//   }
// });
// ===== SONIC =====

let waitTime = 3000;
// var pinEnable = new Gpio(13, 'out');
// var pinDir = new Gpio(19, 'out');
// var pinPulse = new Gpio(21, 'out');

initiateProgram();
const softSPI = new SoftSPI({
  clock: 23, // 23 pin number of SCLK
  mosi: 19, // 19 pin number of MOSI
  miso: 21, // 21 pin number of MISO
  client: 24 // 24 pin number of CS
});
const mfrc522 = new Mfrc522(softSPI).setResetPin(22);

var configuringKuotaFlag = false;
var kuotaConfigured = 0;

function initiateProgram () {
  console.log(ip.address())
  // pinEnable.writeSync(1);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

var mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    // frame: false
  });

  mainWindow.setMenuBarVisibility(false);
  // mainWindow.setFullScreen(true)

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'beras.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('tambah-kartu', function(event, data) {
  configuringKuotaFlag = true;
  kuotaConfigured = data;
  rfidInterval = setInterval(startRfid, 500);
});

ipcMain.on('beras-state', function(event, data) {
  console.log('=== PAUSE RFID INTERVAL ===');
  clearInterval(rfidInterval);
});

ipcMain.on('kosongkan-tangki', function(event, data) {
  if (data) {
    console.log('start kosongkan-tangki');
  } else {
    console.log('stop kosongkan-tangki');
  }
});

ipcMain.on('restart-rfid', function(event, data) {
  restartRfid();
});

ipcMain.on('kosongkan-tangki', function(event, data) {
  startKosongkanTangki = data
  if (startKosongkanTangki) {
    console.log("STEPPER ROTATING");
    // pinEnable.writeSync(0)
  } else {
    // pinEnable.writeSync(1)
  }

});

var rfidInterval = setInterval(startRfid, 500);
var sonicInterval = setInterval(startScanSonic, 1000);

function restartRfid () {
  clearInterval(rfidInterval);
  rfidInterval = setInterval(startRfid, 500);
}

function startRfid () {
  mfrc522.reset();

  let response = mfrc522.findCard();
  if (!response.status) {
    console.log("No Card configuringKuotaFlag: %s kuotaConfigured: %s", configuringKuotaFlag, kuotaConfigured);
    return;
  } else {
    // STOP SCANNING ANOTHER CARD
    clearInterval(rfidInterval);
  }
  console.log("Card detected, CardType: " + response.bitSize);

  //# Get the UID of the card
  response = mfrc522.getUid();
  if (!response.status) {
    console.log("UID Scan Error");
    return;
  }
  const uid = response.data;
  let cardID = uid.toString();
  console.log('===== Card ID: ' + cardID);

  //# Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uid);
  console.log("Card Memory Capacity: " + memoryCapacity);

  //# This is the default key for authentication
  const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

  var blockIndexes = [1, 4];
  var roleBlock = 1
  var isAdmin = false;

  if (!mfrc522.authenticate(roleBlock, key, uid)) {
    console.log("Authentication Error");
    return;
  }
  let bufferOriginal = Buffer.from(mfrc522.getDataForBlock(roleBlock));
  console.log("Block: " + roleBlock + " Data: " + bufferOriginal.toString('utf8'));

  if (bufferOriginal.toString('utf8').includes("admn")) {
    mainWindow.webContents.send('role-data', "admin");
  } else {
    var now = new Date();
    if (configuringKuotaFlag) {
      rfid_table.findAll({
        where: {
          id_kartu: cardID
        }
      }).then(rfid_table_find => {
        if (rfid_table_find.length > 0) {
          rfid_table.update({
            status_kartu: 'AKTIF',
            nama_kartu: 'USER',
            period: kuotaConfigured
          }, {
            where: {
              id_kartu: cardID
            }
          }).then(rfid_table_update => {
            configuringKuotaFlag = false;
            kuotaConfigured = 0;
            mainWindow.webContents.send('general-info', 'Update kartu berhasil..');
            wait(waitTime);
            mainWindow.webContents.send('general-info', 'Silahkan tempelkan Kartu anda.');
            mainWindow.webContents.send('hide-welcome', true);
            // restartRfid();
          })
        } else {
          rfid_table.create({
            id_kartu: cardID,
            status_kartu: 'AKTIF',
            nama_kartu: 'USER',
            period: kuotaConfigured
          }).then(rfid_table_insert => {
            configuringKuotaFlag = false;
            kuotaConfigured = 0;
            mainWindow.webContents.send('general-info', 'Update kartu berhasil..');
            wait(waitTime);
            mainWindow.webContents.send('general-info', 'Silahkan tempelkan Kartu anda.');
            mainWindow.webContents.send('hide-welcome', true);
            // restartRfid();
          });
        }
      })
    } else {
      mainWindow.webContents.send('role-data', "user");
      rfid_table.findAll({
        where: {
          id_kartu: cardID
        }
      }).then(rfid_table_find => {
        if (rfid_table_find.length > 0) {
          console.log('card found')
          var cardPeriod = rfid_table_find[0].period;
          var cardLastTap = rfid_table_find[0].last_tap;
          var getBeras = false;
          if (cardLastTap === null) {
            getBeras = true;
          } else {
            getBeras = compareDate(cardLastTap);
          }
          if (getBeras) {
            console.log("=== THIS CARD PERIOD: " + cardPeriod);
            rfid_table.update({
              status_kartu: 'AKTIF',
              nama_kartu: 'USER',
              last_tap: now,
            }, {
              where: {
                id_kartu: cardID
              }
            }).then(rfid_table_update => {
              configuringKuotaFlag = false;
              kuotaConfigured = 0;
              mainWindow.webContents.send('general-info', 'Anda mendapat subsidi: ' + cardPeriod + ' Liter/hari');
              // wait(waitTime);

              // pinEnable.writeSync(0);
              wait(925*12*cardPeriod);
              // pinEnable.writeSync(1);

              mainWindow.webContents.send('general-info', 'Silahkan tempelkan Kartu anda.');
              restartRfid();
            })
          } else {
            mainWindow.webContents.send('general-info', 'Anda telah mendapat beras hari ini..');
            wait(waitTime);
            mainWindow.webContents.send('general-info', 'Silahkan tempelkan Kartu anda.');
            restartRfid();
          }
        } else {
          // console.log('card not registered')
          mainWindow.webContents.send('general-info', 'Kartu tidak terdaftar...');
          wait(waitTime);
          mainWindow.webContents.send('general-info', 'Silahkan tempelkan Kartu anda.');
          restartRfid();
        }
      })
    }
  }







  // for (var i=0; i<blockIndexes.length; i++) {
  //   if (!mfrc522.authenticate(blockIndexes[i], key, uid)) {
  //     console.log("Authentication Error");
  //     return;
  //   }

  //   let bufferOriginal = Buffer.from(mfrc522.getDataForBlock(blockIndexes[i]));
  //   console.log("Block: " + blockIndexes[i] + " Data: " + bufferOriginal.toString('utf8'));

    // let { beras } = store.get('windowBounds');
    // if (blockIndexes[i] == 1) {
    //   if (bufferOriginal.toString('utf8').includes("admn")) {
    //     console.log('this is admin')
    //     isAdmin = true
    //     mainWindow.webContents.send('role-data', "admin");
    //     mainWindow.webContents.send('admin-data', beras);
    //   } else {
    //     isAdmin = false
    //     if (isTambahKartu) {
    //       console.log('penambahaan kartu block 1');
    //       var tambahKartuBuf = Buffer.from('user', 'utf8');
    //       var newKartuData = [];

    //       for (var i=0; i<tambahKartuBuf.length; i++) {
    //         newKartuData.push(tambahKartuBuf[i])
    //       }
    //       mfrc522.writeDataToBlock(1, newKartuData)
    //       mainWindow.webContents.send('role-data', "user");
    //       mainWindow.webContents.send('general-info', 'Penambahan kartu berhasil!');
    //       wait(3000);
    //       mainWindow.webContents.send('general-info', '');
    //       isTambahKartu = false;
    //     }
    //     console.log('this is not admin')
    //     mainWindow.webContents.send('role-data', "user");
    //   }
    // }


    // if (blockIndexes[i] == 4) {
    //   if (!isAdmin) {
    //     if (isTambahKuota) {
    //       console.log('isTambahKuota block 4')
    //       var tambahKuotaBuf = Buffer.from(newTambahKuota, 'utf8');
    //       var newTambahKuotaData = [];

    //       for (var i=0; i<tambahKuotaBuf.length; i++) {
    //         newTambahKuotaData.push(tambahKuotaBuf[i])
    //       }
    //       mfrc522.writeDataToBlock(4, newTambahKuotaData);
    //       mainWindow.webContents.send('general-info', 'Penambahan kuota berhasil!');
    //       wait(3000);
    //       mainWindow.webContents.send('general-info', '');
    //       isTambahKuota = false;
    //     } else if (isTambahKartu) {
    //       console.log('isTambahKartu block 4')

    //       // var resetKuotaBuf = Buffer.from('0', 'utf8');
    //       // var newKuotaData = [];

    //       // for (var i=0; i<resetKuotaBuf.length; i++) {
    //       //   newKuotaData.push(resetKuotaBuf[i])
    //       // }
    //       // mfrc522.writeDataToBlock(4, newKuotaData)


    //       isTambahKartu = false;
    //     } else {
    //       console.log('else block 4')
    //       if (berasRemain > 70) {
    //         mainWindow.webContents.send('alert', 'beras-alert');
    //       } else {
    //         mainWindow.webContents.send('store-data', bufferOriginal.toString('utf8'));
    //         var intKuota = parseInt(bufferOriginal.toString('utf8'), 10);
    //         var jatahSubs = parseInt(beras);

    //         if (intKuota >= jatahSubs) {
    //           console.log('cukup')
    //           var newKuota = intKuota - jatahSubs;
    //           mainWindow.webContents.send('store-data', newKuota);
    //           var buf = Buffer.from(newKuota.toString(), 'utf8');
    //           var newData = [];

    //           for (var i=0; i<buf.length; i++) {
    //             newData.push(buf[i])
    //           }
    //           mfrc522.writeDataToBlock(4, newData)
              
    //           console.log("STEPPER ROTATING");
              
    //           pinEnable.writeSync(0)
    //           wait(925*jatahSubs)
    //           pinEnable.writeSync(1)
    //           // pinDir.writeSync(1)
    //           // for (var i=0; i<(jatahSubs*35); i++) {
    //           //   pinPulse.writeSync(1);
    //           //   wait(10)
    //           //   pinPulse.writeSync(0)
    //           //   wait(10)
    //           // }
    //           // wait(1000);
    //           // pinEnable.writeSync(1)
    //           mainWindow.webContents.send('clear', 'alert');
    //         } else {
    //           mainWindow.webContents.send('alert', 'alert');
    //           console.log('kurang')
    //         } 
    //       }
    //     }
    //   }
    // }
  // }

  //# Stop
  mfrc522.stopCrypto();
}

function startScanSonic () {
  // trigger.trigger(10, 1);
}

function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
  }
}

function compareDate (lastTapDate) {
  // var lastTapDateSplit = lastTapDate.toString().split(/[- :]/);
  // var lastTap = new Date(Date.UTC(lastTapDateSplit[0], lastTapDateSplit[1]-1, lastTapDateSplit[2], lastTapDateSplit[3], lastTapDateSplit[4], lastTapDateSplit[5]));
  var now = new Date();

  console.log(now)
  console.log(lastTapDate)

  var getBeras = false;

  console.log('day now: %s day last tap %s', now.getDate(), lastTapDate.getDate())

  if (lastTapDate.getDate() == now.getDate()) {
    if (lastTapDate.getMonth() == now.getMonth()) {
      if (lastTapDate.getFullYear() == now.getFullYear()) {
        getBeras = false;
      }
    }
  } else {
    getBeras = true;
  }
  // console.log('getBeras: %s', getBeras)
  return getBeras;
}