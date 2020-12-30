const ExcelJS = require('exceljs');
const fetch = require('node-fetch');

var workbook = new ExcelJS.Workbook();
const filename = './all_locations_details.csv';
let lastItem = Promise.resolve();
workbook.csv.readFile(filename)
.then(function(worksheet) {
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber === 1) {
        return;
      }
      const suburb = row.values[3];
      const postcode = row.values[4];
      lastItem = lastItem.then(() => {
        return fetch("https://salefinder.com.au/ajax/locationsearch?callback=custom&query=" + postcode, {
          "method": "GET",
        }).then(response => response.text())
        .then((response) => {
          const obj = JSON.parse(response.replace('custom(', '').slice(0, -1));
          if (obj) {
            console.log(suburb, postcode);
            console.log(obj);
            if (obj.suggestions && obj.suggestions.length) {
              const matched = obj.suggestions.filter(suggestion => suggestion.value === `${suburb.toUpperCase()}, ${postcode}`)[0];
              if (matched) {
                row.getCell(7).value = matched.data;
                console.log('Matched: ' + matched.data);
              } else {
                row.getCell(7).value = obj.Id;
                console.log('Fallback to: ' + obj.Id);
              }
            } else {
              row.getCell(7).value = obj.Id;
              console.log('Fallback to: ' + obj.Id);
            }
          }
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