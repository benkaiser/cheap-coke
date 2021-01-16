const fetch = require('node-fetch');
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
      const searchText = row.values[2] + ' ' + row.values[3] + ' ' + row.values[4] + ' Australia';
      lastItem = lastItem.then(() => {
        fetch("https://atlas.microsoft.com/search/address/json?api-version=1.0&query=" + encodeURIComponent(searchText) + "&subscription-key=<SUBKEY>")
        .then(response => response.json())
        .then((res) => {
          if (res && res.results && res.results[0]) {
            row.getCell(5).value = res.results[0].position.lat;
            row.getCell(6).value = res.results[0].position.lon;
            console.log('Successfully set lat lon', rowNumber);
            workbook.csv.writeFile(filename);
          } else {
            console.error('Returned but without lat lon', searchText);
          }
        })
        .catch(() => {
          console.log('Failed to geocode: ' + searchText);
        });
        return new Promise((resolve) => setTimeout(resolve, 50));
      });

      // console.log(row.values[3]);
      // console.log(row.values[5],row.values[6]);
    });

    // return workbook.csv.writeFile(filename);
});