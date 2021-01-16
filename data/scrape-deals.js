const ExcelJS = require('exceljs');
const fetch = require('@adobe/node-fetch-retry');
const cheerio = require('cheerio');
const { eachOfLimit } = require('async');
const fs = require('fs');

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

function parseItems(rawResponse, store) {
  const $ = cheerio.load(rawResponse);
  const items = [];
  $('.item-details').each(function (i, elem) {
    const itemName = $(this).find('.item-name');
    items.push({
      store,
      name: itemName.text().trim(),
      price: $(this).find('.price').text().trim(),
      pricePerLitre: parseFloat($(this).find('.comparative-text').text().trim().replace('$','').replace(' per litre', '')),
      url: itemName.attr('href')
    });
  });
  return items.filter(item => !item.url.includes('beer-wine-and-spirit')).map(catagorizeItem).filter(item => !!item);
}

function pickCheapest(allItems) {
  const canDeals = allItems.filter(item => item.type === 'can');
  const bottleDeals = allItems.filter(item => item.type === 'bottle');
  let bestCanDeal = canDeals[0];
  let bestBottleDeal = bottleDeals[0];
  allItems.forEach(item => {
    if (item.type === 'can') {
      if (item.pricePerLitre < bestCanDeal.pricePerLitre) {
        bestCanDeal = item;
      }
    } else if (item.type === 'bottle') {
      if (item.pricePerLitre < bestBottleDeal.pricePerLitre) {
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
// let lastItem = Promise.resolve();
const uniqueCodes = new Set();
const codeMap = {};
const allStores = [];
workbook.csv.readFile(filename)
.then(function(worksheet) {
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
      if (rowNumber === 1) {
        return;
      }
      const internalCode = row.values[7];
      uniqueCodes.add(internalCode);
      codeMap[internalCode] = codeMap[internalCode] || [];
      codeMap[internalCode].push(row.values);
    });
}).then(() => {
  eachOfLimit(Array.from(uniqueCodes), 10, (internal_code, key, callback) => {
    console.log(`processing: ${key}/${uniqueCodes.size}`);
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
      const woolworthsItems = parseItems(woolworthsResponse, 'woolworths');
      const colesItems = parseItems(colesResponse, 'coles');
      const cheapestWoolworths = pickCheapest(woolworthsItems);
      const cheapestColes = pickCheapest(colesItems);
      codeMap[internal_code].forEach((codeMapItem) => {
        const store = {
          type: codeMapItem[1].toLowerCase(),
          lat: codeMapItem[5],
          lon: codeMapItem[6]
        };
        let thisStoreCheapest = cheapestWoolworths;
        if (store.type.toLowerCase() === 'coles') {
          thisStoreCheapest = cheapestColes;
        }
        if (thisStoreCheapest.can) {
          store.can = {
            price: thisStoreCheapest.can.price,
            pricePerLitre: thisStoreCheapest.can.pricePerLitre,
            qty: thisStoreCheapest.can.qty,
            size: thisStoreCheapest.can.size
          }
        }
        if (thisStoreCheapest.bottle) {
          store.bottle = {
            price: thisStoreCheapest.bottle.price,
            pricePerLitre: thisStoreCheapest.bottle.pricePerLitre,
            size: thisStoreCheapest.bottle.size
          }
        }
        if (store.bottle || store.can) {
          allStores.push(store);
        }
      });
      callback();
    })
    .catch(error => {
      console.error(error);
      callback();
    });
  }, () => {
    fs.writeFileSync('locations-with-prices.json', JSON.stringify(allStores));
    fs.writeFileSync('../script/prices.js', "var prices=" + JSON.stringify(allStores) + ";");
  });
});
