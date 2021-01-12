const ExcelJS = require('exceljs');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

function catagorizeItem(rawItem) {
  const cleanUrl = rawItem.url.replace(/-/g, '');
  if (cleanUrl.includes('24x375')) {
    return {
      ...rawItem,
      type: 'can',
      size: 375,
      qty: 24
    };
  } else if (cleanUrl.includes('30x375')) {
    return {
      ...rawItem,
      type: 'can',
      size: 375,
      qty: 30
    };
  } else if (cleanUrl.includes('10x375')) {
    return {
      ...rawItem,
      type: 'can',
      size: 375,
      qty: 10
    };
  } else if (cleanUrl.includes('125litre')) {
    return {
      ...rawItem,
      type: 'bottle',
      size: 1250,
      qty: 1
    };
  } else if (cleanUrl.includes('15litre')) {
    return {
      ...rawItem,
      type: 'bottle',
      size: 1500,
      qty: 1
    };
  } else if (cleanUrl.includes('2litre')) {
    return {
      ...rawItem,
      type: 'bottle',
      size: 2000,
      qty: 1
    };
  }
  return null;
}

function priceItems(item) {
  return {
    ...item,
    perMl: item.price / item.qty / item.size
  };
}

function parseItems(rawResponse, store) {
  const $ = cheerio.load(rawResponse);
  const items = [];
  $('.item-details').each(function (i, elem) {
    const itemName = $(this).find('.item-name');
    items.push({
      store,
      name: itemName.text().trim(),
      price: parseFloat($(this).find('.price').text().trim().replace('$','').replace(' each', '')),
      url: itemName.attr('href')
    });
  });
  return items.filter(item => !item.url.includes('beer-wine-and-spirit')).map(catagorizeItem).filter(item => !!item).map(priceItems);
}

function pickCheapest(allItems) {
  const canDeals = allItems.filter(item => item.type === 'can');
  const bottleDeals = allItems.filter(item => item.type === 'bottle');
  let bestCanDeal = canDeals[0];
  let bestBottleDeal = bottleDeals[0];
  allItems.forEach(item => {
    if (item.type === 'can') {
      if (item.perMl < bestCanDeal.perMl) {
        bestCanDeal = item;
      }
    } else if (item.type === 'bottle') {
      if (item.perMl < bestBottleDeal.perMl) {
        bestBottleDeal = item;
      }
    }
  });
  return {
    can: bestCanDeal,
    bottle: bestBottleDeal
  }
}

var workbook = new ExcelJS.Workbook();
const filename = './all_locations_details.csv';
let lastItem = Promise.resolve();
workbook.csv.readFile(filename)
.then(function(worksheet) {
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber === 1) {
        return;
      }
      const internal_code = row.values[7];
      lastItem = lastItem.then(() => {
        return Promise.all([
          // woolworths deals
          fetch("https://salefinder.com.au/search/coca%20cola?qs=1,,126,1,41", {
            "headers": {
              "cookie": `postcodeId=${internal_code}`
            }
          }).then(response => response.text()),
          // coles deals
          fetch("https://salefinder.com.au/search/coca%20cola?qs=1,,148,1,41", {
            "headers": {
              "cookie": `postcodeId=${internal_code}`
            }
          }).then(response => response.text())
        ])
        .then(([woolworthsResponse, colesResponse]) => {
          const allItems = parseItems(woolworthsResponse, 'woolworths').concat(parseItems(colesResponse, 'coles'));
          console.log(row.values);
          console.log(allItems);
          const cheapest = pickCheapest(allItems);
          console.log(cheapest);
        })
        .catch(error => {
          console.error(error);
          return new Promise((resolve) => setTimeout(resolve, 100));
        });
      });
    });

    // return workbook.csv.writeFile(filename);
});