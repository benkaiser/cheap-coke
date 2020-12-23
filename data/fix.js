const ExcelJS = require('exceljs');

var workbook = new ExcelJS.Workbook();
const filename = './all_locations_details.csv';
workbook.csv.readFile(filename)
.then(function(worksheet) {
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (/\d/.test(row.values[3])) {
        const match = row.values[3].match(/\d/);
        row.getCell(3).value = row.values[3].slice(0, match.index - 1);
        console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
      }
    });

    return workbook.csv.writeFile(filename);
});