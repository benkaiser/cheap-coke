import { h, Component, render } from 'https://unpkg.com/preact?module';
import htm from 'https://unpkg.com/htm?module';

// default location
let lat = -37.81;
let lon = 144.96;
let nameOfLocality = "Melbourne";
if (window.geoplugin_latitude || window.geoplugin_longitude) {
  lat = geoplugin_latitude();
  lon = geoplugin_longitude();
  nameOfLocality = geoplugin_city();
}

// distance formula
function deg2rad(deg) {
  return deg * (Math.PI/180)
}
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

// Initialize htm with Preact
const html = htm.bind(h);

function findLocation() {
  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };

  function success(pos) {
    var crd = pos.coords;

    console.log('Your current position is:');
    console.log(`Latitude : ${crd.latitude}`);
    console.log(`Longitude: ${crd.longitude}`);
    console.log(`More or less ${crd.accuracy} meters.`);
    calculateAndRender(crd.latitude, crd.longitude, "Your Location");
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  navigator.geolocation.getCurrentPosition(success, error, options);
}

function priceOf(item) {
  return item.price / (item.qty || 1) / item.size;
}

function pickCheapest(closest, type) {
  if (priceOf(closest['woolworths'][type]) < priceOf(closest['coles'][type])) {
    return closest['woolworths'];
  } else {
    return closest['coles'];
  }
}

function App (props) {
  const cheapestCan = pickCheapest(props.closest, 'can');
  const cheapestBottle = pickCheapest(props.closest, 'bottle');
  return html`
    <h3>Cheapest Coke for <span id="city">${props.city}</span>
      ${ props.city !== "Your Location" && html` <button onClick=${findLocation}>Use My Location</button>`}
    </h3>
    <p>
    Cheapest cans can be found at ${cheapestCan.type} (${cheapestCan.can.qty} x ${cheapestCan.can.size}ml for $${cheapestCan.can.price})
    </p>
    <p>
    Cheapest bottles can be found at ${cheapestBottle.type} (${cheapestBottle.bottle.size}ml for $${cheapestBottle.bottle.price})
    </p>
  `;
}

function calculateClosest(lat, lon) {
  let closest = {};
  prices.forEach(store => {
    if (
      closest[store.type] === undefined ||
      getDistanceFromLatLonInKm(lat, lon, store.lat, store.lon) < closest[store.type].distance
    ) {
      closest[store.type] = {
        ...store,
        distance: getDistanceFromLatLonInKm(lat, lon, store.lat, store.lon)
      };
    }
  });
  return closest;
}

function calculateAndRender(lat, lon, city) {
  const closest = calculateClosest(lat, lon);
  render(html`<${App} city=${city} closest=${closest} />`, document.getElementById('main'));
}

calculateAndRender(lat, lon, nameOfLocality);