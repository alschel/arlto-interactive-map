// This will let you use the .remove() function later on
if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}

// Define home bbox and zoom 
let home = {
    lat: 57.6,
    lon: 67.8,
    zoom: 7
}

// Initialize the map
let map = L.map('map').setView([home.lat, home.lon], home.zoom);

// Add baselayer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 7,
    maxZomm: 14,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
    ).addTo(map);

// Add home button    
L.easyButton('<span class="curren">&curren;</span>', function(btn,map){
    //map.setView([home.lat, home.lon], home.zoom);
    map.flyTo([home.lat, home.lon], home.zoom);
},'Zoom To Home').addTo(map);


// Read the data from the geojson files
let islam = (function () {
    let islam;
        $.ajax({
            'async': false, // Чтобы данные успели подгрузиться до загрузки карты, делаем запрос асинхронным
            'global': false,
            'url': 'data/islam.geojson',
            'dataType': "json",
            'success': function (data) {
                islam = data;
            }
        });
        return islam;
    })();

let orthodox = (function () {
    let orthodox;
        $.ajax({
            'async': false, // Чтобы данные успели подгрузиться до загрузки карты, делаем запрос асинхронным
            'global': false,
            'url': 'data/orthodox.geojson',
            'dataType': "json",
            'success': function (data) {
                orthodox = data;
            }
        });
        return orthodox;
    })();

let catholic = (function () {
    let catholic;
        $.ajax({
            'async': false, // Чтобы данные успели подгрузиться до загрузки карты, делаем запрос асинхронным
            'global': false,
            'url': 'data/catholic.geojson',
            'dataType': "json",
            'success': function (data) {
                catholic = data;
            }
        });
        return catholic;
    })();

let judaism = (function () {
    let judaism;
        $.ajax({
            'async': false, // Чтобы данные успели подгрузиться до загрузки карты, делаем запрос асинхронным
            'global': false,
            'url': 'data/judaism.geojson',
            'dataType': "json",
            'success': function (data) {
                judaism = data;
            }
        });
        return judaism;
    })();
    
let communities_dict = {
    "Ислам": islam,
    "Православие": orthodox,
    "Католицизм": catholic,
    "Иудаизм": judaism
}

// Helping list to control listings 
let communities_active = {
    "Ислам": true,
    "Православие": false,
    "Католицизм": false,
    "Иудаизм": false
}

// Function to concate geojson files
function concatGeoJSON(g1, g2){
    return { 
        "type" : "FeatureCollection",
        "features": [... g1.features, ... g2.features]
    }
}

// Function to build data for locationList
function buildData(){
    var filtered = Object.keys(communities_dict).
    filter((key) => communities_active[key])
    console.log(filtered);
    var communities = [];
    if (filtered.length >= 1){
        communities = communities_dict[filtered[0]];
        if (filtered.length > 1){
            for(i = 1; i < filtered.length; i++){
                communities = concatGeoJSON(communities, communities_dict[filtered[i]]);
            }
        }
    }
    return communities;
}

// Прежде чем добавить слой с объектами, определим несколько вспомогательных функций

// 1. Build a function to iterate through the sidebar listing
function buildLocationList(data) {
    let listings = document.getElementById('listings');
    while (listings.lastElementChild) {
        listings.removeChild(listings.lastElementChild);
        }

    if (data != 0) {

        // Iterate through the list of objects
        for (i = 0; i < data.features.length; i++) {
            let currentFeature = data.features[i];
            // Shorten data.feature.properties to just `prop` so we're not
            // writing this long form over and over again.
            let prop = currentFeature.properties;
            // Select the listing container in the HTML and append a div
            // with the class 'item' for each objects
            let listings = document.getElementById('listings');
            let listing = listings.appendChild(document.createElement('div'));
            listing.className = 'item';
            listing.id = 'listing-' + i;

            // Create a new link with the class 'title' for each objects
            // and fill it with the objects name
            let link = listing.appendChild(document.createElement('a'));
            link.href = '#';
            link.className = 'title';
            link.dataPosition = i;
            link.innerHTML = prop.Name;

            //Create a new div with the class 'details' for each objects and fill it with data
            let details = listing.appendChild(document.createElement('div'));
            details.className = 'details';
            if (prop.Address) {
                details.innerHTML += '<br>' + prop.Address + '<br>';
            }
            if (prop.Date) {
                details.innerHTML += '<br>' + prop.Date + '<br>';
            }
            if (prop.Сentral_organization) {
                details.innerHTML += '<br>В составе централизованной организации: ' + prop.Сentral_organization + '<br>';
            }
            if (prop.Rituals) {
                details.innerHTML += '<br>Ритуалы, организуемые в течение года: ' + prop.Rituals + '<br>';
            }
            if (prop.Area_of_influence) {
                details.innerHTML += '<br>Зона влияния: ' + prop.Area_of_influence + '<br>';
            }

            // Add an event listener for the links in the sidebar listing
            link.addEventListener('click', function(e) {
                // Update the currentFeature to the object associated with the clicked link
                let clickedListing = data.features[this.dataPosition];
                // 1. Fly to the point associated with the clicked link
                flyToObject(clickedListing);

                // 2. Highlight listing in sidebar (and remove highlight for all other listings)
                let activeItem = document.getElementsByClassName('active');
                if (activeItem[0]) {
                    activeItem[0].classList.remove('active');
                }
                this.parentNode.classList.add('active');

                // 3. Scroll the the active listing
                this.parentNode.scrollIntoView({block: "start", behavior: "smooth"});

            });
        }
    }
    
}

// 2. Build a function to iterate through the locations on the map 
function highlightListing(e) {

    // Remove highlight for all other listings
    let activeItem = document.getElementsByClassName('active');
    console.log(activeItem);
    if (activeItem[0]) {
        activeItem[0].classList.remove('active');
    }

    // Find the index of the communities.features that corresponds to the clickedPoint that fired the event listener
    let selectedFeature = e.target.feature.properties.Name;
    for (var i = 0; i < buildData().features.length; i++) {
        if (buildData().features[i].properties.Name === selectedFeature) {
        selectedFeatureIndex = i;
        }
    }
    // Select the correct list item using the found index and add the active class
    let listing = document.getElementById('listing-' + selectedFeatureIndex);
    listing.classList.add('active');

    // Scroll the active listing
    listing.scrollIntoView({block: "start", behavior: "smooth"});

    // Fly to Feature
    map.flyTo(e.target.getLatLng(), 15);

}

// Build a function to fly to the object after click on object location on a listing item
function flyToObject(currentFeature) {
    let coords = currentFeature.geometry.coordinates;
    map.flyTo([coords[1], coords[0]], 15);
}

// Function to create popUp on hover event with name
function makePopup(e) {
    var layer = e.target;

    var popup = L.popup()
    .setLatLng(layer.getLatLng())
    .setContent(layer.feature.properties.Name)
    .openOn(map);
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}


// Add event calls to the layers 
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: makePopup,
        //mouseout: resetHighlight,
        click: highlightListing
    });
}

// Define circles style
var geojsonMarkerOptions = {
    radius: 6,
    color: "#000",
    weight: 1,
    opacity: 0.5,
    fillOpacity: 0.8
};

// Create layers from geojson data
let islamLayer = L.geoJson(islam, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    style: {fillColor: 'forestgreen'},
    onEachFeature: onEachFeature
})

let orthodoxLayer = L.geoJson(orthodox, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    style: {fillColor: 'red'},
    onEachFeature: onEachFeature
})

let catholicLayer = L.geoJson(catholic, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    style: {fillColor: '#65156e'},
    onEachFeature: onEachFeature
})

let judaismLayer = L.geoJson(judaism, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    style: {fillColor: '#0066cc'},
    onEachFeature: onEachFeature
})

// Create LayerGroup
let communitiesPoints = {
    "Ислам": islamLayer,
    "Православие": orthodoxLayer,
    "Католицизм": catholicLayer,
    "Иудаизм": judaismLayer
};

// Add layer control
var layerControl = L.control.layers(null, communitiesPoints, {collapsed: false, autoZIndex: true}).addTo(map);
communitiesPoints.Ислам.addTo(map);
buildLocationList(buildData());

// Add events on adding/removing layers to rebuild data and locationList
map.on('overlayadd', function(e){
    layer = e.name;
    console.log(layer);
    communities_active[layer] = true;
    buildLocationList(
        buildData()
        );
});

map.on('overlayremove', function(e){
    layer = e.name;
    console.log(layer);
    communities_active[layer] = false;
    buildLocationList(
        buildData()
        );
});