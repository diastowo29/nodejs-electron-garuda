function calcTime(city, offset) {
    // create Date object for current location
    var d = new Date();

    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + (3600000*offset));

    // return time as a string
    // return "The local time for city"+ city +" is " + nd;
    return nd
}
console.log(calcTime('Jakarta', '+7'))

var jakarta = new Date().toLocaleTimeString({ timeZone: 'Asia/Jakarta' })
console.log(jakarta)

var now = new Date()
console.log(now)