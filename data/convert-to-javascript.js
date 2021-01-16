const fs = require('fs');
const jsonFile = fs.readFileSync('locations-with-prices.json');
fs.writeFileSync('../script/prices.js', "var prices=" + jsonFile + ";");
