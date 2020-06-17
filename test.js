var uid = [213, 8, 190, 118, 21]
console.log('==== CARD UID: %s', uid.toString());
let idBuffer = Buffer.from(uid);
console.log('==== IDBUFFER: %s', idBuffer);
let cardID = idBuffer.toString('utf8');
console.log('===== Card ID: ' + cardID);