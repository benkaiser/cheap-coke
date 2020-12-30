const openGeocoder = require('node-open-geocoder');
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./postcodes.json', 'utf8'));

const ExcelJS = require('exceljs');

var workbook = new ExcelJS.Workbook();
const filename = './all_locations_details.csv';
let lastItem = Promise.resolve();
workbook.csv.readFile(filename)
.then(function(worksheet) {
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber === 1) {
        return;
      }
      // console.log(rowNumber, row.values[3], row.values[4]);
      // console.log(obj[row.values[4]]);
      // const objLookup = obj[row.values[4]];
      // if (!objLookup) {
      //   console.log("Postcode not found", row.values[3], row.values[4]);
      //   return;
      // }
      // const exactMatches = objLookup.filter((item) => item[1].toLowerCase() === row.values[3].toLowerCase());
      // if (exactMatches.length) {
      //   row.getCell(5).value = exactMatches[0][3];
      //   row.getCell(6).value = exactMatches[0][4];
      // } else {
        // row.getCell(5).value = objLookup[0][3];
        // row.getCell(6).value = objLookup[0][4];
      // }
      const searchText = row.values[2] + ' ' + row.values[3] + ' ' + row.values[4] + ' Australia';
      lastItem = lastItem.then(() => {
        openGeocoder()
        .geocode(searchText)
        .end((err, res) => {
          if (!err) {
            if (res[0]&& res[0].lat && res[0].lon) {
              row.getCell(5).value = res[0].lat;
              row.getCell(6).value = res[0].lon;
              console.log('Successfully set lat lon', rowNumber)
            } else {
              console.error('Returned but without lat lon', searchText);
            }
          } else {
            console.error(err);
          }
        })
        workbook.csv.writeFile(filename);
        return new Promise((resolve) => setTimeout(resolve, 1000));
      });

      // console.log(row.values[3]);
      // console.log(row.values[5],row.values[6]);
    });

    // return workbook.csv.writeFile(filename);
});