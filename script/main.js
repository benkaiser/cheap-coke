import { h, Component, render } from 'https://unpkg.com/preact?module';
import htm from 'https://unpkg.com/htm?module';

// default location
let lat = -37.81;
let lon = 144.96;
let nameOfLocality = "Melbourne";
if (window.geoplugin_latitude) {
  lat = geoplugin_latitude();
  lon = geoplugin_longitude();
  nameOfLocality = geoplugin_city();
}
window.on_geo = function() {
  lat = geoplugin_latitude();
  lon = geoplugin_longitude();
  nameOfLocality = geoplugin_city();
  calculateAndRender(lat, lon, nameOfLocality)
}

navigator.permissions.query({name:'geolocation'})
.then(function(permissionStatus) {
  if (permissionStatus.state === 'granted') {
    findLocation();
  }
});

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
    calculateAndRender(crd.latitude, crd.longitude, "Your Location");
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  navigator.geolocation.getCurrentPosition(success, error, options);
}

function pickCheapest(closest, type) {
  if (closest['coles'][type] === undefined) {
    return closest['woolworths'];
  }
  if (closest['woolworths'][type] === undefined) {
    return closest['coles'];
  }
  if (closest['woolworths'][type].pricePerLitre < closest['coles'][type].pricePerLitre) {
    return closest['woolworths'];
  } else {
    return closest['coles'];
  }
}

function cheaperThan(cheapestStore) {
  return cheapestStore === 'woolworths' ? 'Coles' : 'Woolworths';
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pepsiText: "Pepsi OK?"
    };
  }

  render() {
    const props = this.props;
    const cheapestCan = pickCheapest(props.closest, 'can');
    const cheapestBottle = pickCheapest(props.closest, 'bottle');
    return html`
      <h1 className="cursive">Cheap Coke for <span id="city">${props.city}</span></h1>
      ${ props.city !== "Your Location" && html` <button className="myLocation button-primary" onClick=${findLocation}>Use My Location</button>`}
      <div className="itemContainer">
        <img src="images/can.png" className="itemPreview"/>
        <div className="itemDetails">
          <img src="images/${cheapestCan.type}.png" className="brandLogo"/>
          <h5 className="itemPricing">Is cheaper than ${cheaperThan(cheapestCan.type)}</h5>
          <h5 className="itemPricing">${ cheapestCan.can.qty }x${ cheapestCan.can.size }ml: ${ cheapestCan.can.price }</h5>
          <p className="pricePer">$${(0.375 * cheapestCan.can.pricePerLitre).toFixed(2)} per can</p>
        </div>
      </div>
      <div className="itemContainer">
        <img src="images/bottle.png" className="itemPreview"/>
        <div className="itemDetails">
          <img src="images/${cheapestBottle.type}.png" className="brandLogo"/>
          <h5 className="itemPricing">Is cheaper than ${cheaperThan(cheapestBottle.type)}</h5>
          <h5 className="itemPricing">${ (cheapestBottle.bottle.size / 1000).toString() }L: ${ cheapestBottle.bottle.price }</h5>
          <p className="pricePer">$${(cheapestBottle.bottle.pricePerLitre).toFixed(2)} per litre</p>
        </div>
      </div>
      <button className="pepsiOk" onFocus=${this.onPepsiFocus.bind(this)} onBlur=${this.onPepsiBlur.bind(this)}>${ this.state.pepsiText }</button>
    `;
  }

  onPepsiFocus() {
    this.setState({
      pepsiText: "No, it's not"
    });
  }

  onPepsiBlur() {
    this.setState({
      pepsiText: "Pepsi OK?"
    });
  }
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