let lat = -37.81;
let lon = 144.96;
let nameOfLocality = "Melbourne";
if (geoplugin_latitude || geoplugin_longitude) {
  lat = geoplugin_latitude();
  lon = geoplugin_longitude();
  nameOfLocality = geoplugin_city();
}

document.getElementById('city').innerHTML = nameOfLocality;