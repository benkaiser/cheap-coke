const ExcelJS = require('exceljs');
const fetch = require('node-fetch');

function pickBestCodeForSearch(suburb, postcode, isFallback = false) {
  return fetch("https://salefinder.com.au/ajax/locationsearch?callback=custom&query=" + (isFallback ? suburb : postcode), {
    "method": "GET",
  }).then(response => response.text())
  .then((response) => {
    const obj = JSON.parse(response.replace('custom(', '').slice(0, -1));
    if (obj) {
      console.log(obj);
      if (obj.suggestions && obj.suggestions.length) {
        const matched = obj.suggestions.filter(suggestion => suggestion.value === `${suburb.toUpperCase()}, ${postcode}`)[0];
        if (matched) {
          console.log('Matched: ' + matched.data);
          return matched.data;
        } else {
          console.log('Fallback to: ' + obj.Id);
          return obj.Id;
        }
      } else {
        if (isFallback) {
          console.log('No fallback left');
          return undefined;
        } else {
          console.log('Falling back');
          return pickBestCodeForSearch(suburb, postcode, true);
        }
      }
    }
  })
}

var workbook = new ExcelJS.Workbook();
const filename = './all_locations_details.csv';
let lastItem = Promise.resolve();
workbook.csv.readFile(filename)
.then(function(worksheet) {
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber === 1 || row.getCell(7).value) {
        return;
      }
      const suburb = row.values[3];
      let postcode = String(row.values[4]);
      if (postcode.length === 3) {
        postcode = '0' + postcode;
      }
      lastItem = lastItem.then(() => {
        return pickBestCodeForSearch(suburb, postcode)
        .then(result => {
          row.getCell(7).value = result;
          workbook.csv.writeFile(filename)
          return new Promise((resolve) => setTimeout(resolve, 100));
        })
        .catch(error => {
          console.error(error);
          return new Promise((resolve) => setTimeout(resolve, 100));
        });
      });
    });

    // return workbook.csv.writeFile(filename);
});