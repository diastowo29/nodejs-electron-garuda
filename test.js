var t = "2020-06-09 13:12:01".split(/[- :]/);
var d = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
var now = new Date();

console.log(d.getDate());
console.log(now.getDate());

console.log(d.getMonth());
console.log(now.getMonth());

console.log(d.getFullYear());
console.log(now.getFullYear());
