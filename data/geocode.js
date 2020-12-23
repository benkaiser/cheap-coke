var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./postcodes.json', 'utf8'));

const ExcelJS = require('exceljs');

var workbook = new ExcelJS.Workbook();
const filename = './all_locations_details.csv';
workbook.csv.readFile(filename)
.then(function(worksheet) {
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber === 1) {
        return;
      }
      // console.log(rowNumber, row.values[3], row.values[4]);
      // console.log(obj[row.values[4]]);
      const objLookup = obj[row.values[4]];
      if (!objLookup) {
        console.log("Postcode not found", row.values[3], row.values[4]);
        return;
      }
      const exactMatches = objLookup.filter((item) => item[1].toLowerCase() === row.values[3].toLowerCase());
      if (exactMatches.length) {
        row.getCell(5).value = exactMatches[0][3];
        row.getCell(6).value = exactMatches[0][4];
      } else {
        row.getCell(5).value = objLookup[0][3];
        row.getCell(6).value = objLookup[0][4];
      }
      // console.log(row.values[3]);
      // console.log(row.values[5],row.values[6]);
    });

    return workbook.csv.writeFile(filename);
});