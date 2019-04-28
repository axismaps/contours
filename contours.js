if (!HTMLCanvasElement.prototype.toBlob) {
 Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: function (callback, type, quality) {

    var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
        len = binStr.length,
        arr = new Uint8Array(len);

    for (var i=0; i<len; i++ ) {
     arr[i] = binStr.charCodeAt(i);
    }

    callback( new Blob( [arr], {type: type || 'image/png'} ) );
  }
 });
}

// canvas on which the contours will be drawn
var contourCanvas = document.createElement('canvas');
contourCanvas.id='contours';
var contourContext;
var buffer = 5; // for a small buffer around the window, so we don't see lines around the edges

// invisible canvas to which Mapzen elevation tiles will be drawn so we can calculate stuff
var demCanvas = document.createElement('canvas');
var demContext;
var demImageData;
var demData;

var contourContext = contourCanvas.getContext('2d');
var demContext = demCanvas.getContext('2d');

var mapNode = d3.select('#map').node();
var width = mapNode.offsetWidth + 2*buffer;
var height = mapNode.offsetHeight + 2*buffer;
contourCanvas.width = width;
contourCanvas.height = height;
demCanvas.width = width;
demCanvas.height = height;

var path = d3.geoPath().context(contourContext);
var svgPath = d3.geoPath();

var min;
var max;
var interval;
var majorInterval = 0;
var thresholds;
var contour = d3.contours()
    .size([width, height]);
var contoursGeoData;

var wait;

// variables for styles etc. below

var type = 'lines';
var unit = 'ft';

var lineWidth = .75;
var lineWidthMajor = 1.5;
var lineColor = '#8c7556';

var highlightColor = 'rgba(177,174,164,.5)';
var shadowColor = '#5b5143';
var shadowSize = 2;

var colorType = 'none';
var solidColor = '#fffcfa';
var hypsoColor = d3.scaleLinear()
  .domain([0, 6000])
  .range(["#486341", "#e5d9c9"])
  .interpolate(d3.interpolateHcl);
var oceanColor = '#d5f2ff';
var bathyColorType = 'none';
var bathyColor = d3.scaleLinear()
  .domain([0, 6000])
  .range(["#315d9b", "#d5f2ff"]);

var contourSVG;

window.onresize = function () {
  width = mapNode.offsetWidth + 2*buffer;
  height = mapNode.offsetHeight + 2*buffer;
  contourCanvas.width = width;
  contourCanvas.height = height;
  demCanvas.width = width;
  demCanvas.height = height;
  contour.size([width, height]);
  clearTimeout(wait);
  wait = setTimeout(getRelief,500);
}

/* UI event handlers */

d3.selectAll('.settings-row.type input').on('change', function () {
  type = d3.select('.settings-row.type input:checked').node().value;
  d3.select('#major').attr('disabled', type =='illuminated' ? 'disabled' : null);
  d3.select('#lines-style').style('display', type =='illuminated' ? 'none' : 'block');
  d3.select('#illuminated-style').style('display', type =='illuminated' ? 'block' : 'none');
  load(drawContours);
});

d3.select('#interval-input').on('keyup', function () {
  if (+this.value == interval) return;
  clearTimeout(wait);
  wait = setTimeout(function () { load(getContours) },500);
});

d3.selectAll('input[name="unit"]').on('change', function () {
  if (this.checked) unit = this.value;
  load(getContours);
})

d3.select('#major').on('change', function () {
  majorInterval = +this.value * interval;
  d3.select('#line-width-major').attr('disabled', majorInterval == 0 ? 'disabled' : null)
  load(drawContours);
});

d3.select('#line-width-major').on('keyup', function () {
  if (isNaN(this.value) || +this.value < 0) this.value = 1.5;
  lineWidthMajor = +this.value;
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#line-width').on('keyup', function () {
  if (isNaN(this.value) || +this.value < 0) this.value = .75;
  lineWidth = +this.value;
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#line-color').on('change', function () {
  lineColor = d3.event.detail;
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#highlight-color').on('change', function () {
  var rgba = toRGBA(d3.event.detail);
  highlightColor = rgba.slice(0, rgba.lastIndexOf(',')) + ',.5)';
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#shadow-color').on('change', function () {
  shadowColor = d3.event.detail;
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#shadow-width').on('keyup', function () {
  if (isNaN(this.value) || +this.value < 0) this.value = 2;
  shadowSize = +this.value;
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#settings-toggle').on('click', function () {
  d3.select('#settings').classed('show', !d3.select('#settings').classed('show'));
  d3.select(this).classed('show', !d3.select(this).classed('show'));
  if (d3.select('#settings').classed('show')) {
    d3.selectAll('#download, #download-toggle').classed('show', false);
  }
  d3.select('#wrapper').classed('panel-open', d3.select('#settings').classed('show') || d3.select('#download').classed('show'));
});

d3.select('#download-toggle').on('click', function () {
  d3.select('#download').classed('show', !d3.select('#download').classed('show'));
  d3.select(this).classed('show', !d3.select(this).classed('show'));
  if (d3.select('#download').classed('show')) {
    d3.selectAll('#settings, #settings-toggle').classed('show', false);
  }
  d3.select('#wrapper').classed('panel-open', d3.select('#settings').classed('show') || d3.select('#download').classed('show'));
});

d3.selectAll('input[name="bg"]').on('change', function () {
  if (d3.select('#no-bg').node().checked) {
    d3.select('#solid-style').classed('disabled', true);
    d3.select('#hypso-style').classed('disabled', true);
    colorType = 'none';
  } else if (d3.select('#solid-bg').node().checked) {
    d3.select('#solid-style').classed('disabled', false);
    d3.select('#hypso-style').classed('disabled', true);
    colorType = 'solid';
  } else {
    d3.select('#solid-style').classed('disabled', true);
    d3.select('#hypso-style').classed('disabled', false);
    colorType = 'hypso';
  }
  d3.selectAll('#solid-style input, #hypso-style input').attr('disabled', null);
  d3.selectAll('.disabled input').attr('disabled', 'disabled');
  load(drawContours);
})

d3.select('#solid-color').on('change', function () {
  solidColor = d3.event.detail;
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#hypso-low-color').on('change', function () {
  hypsoColor.range([d3.event.detail, hypsoColor.range()[1]]);
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#hypso-high-color').on('change', function () {
  hypsoColor.range([hypsoColor.range()[0], d3.event.detail]);
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.selectAll('input[name="bathy"]').on('change', function () {
  if (d3.select('#no-bathy').node().checked) {
    d3.select('#solid-bathy-style').classed('disabled', true);
    d3.select('#bathy-style').classed('disabled', true);
    bathyColorType = 'none';
    hypsoColor.domain([min,max]);
  } else if (d3.select('#solid-bathy').node().checked) {
    d3.select('#solid-bathy-style').classed('disabled', false);
    d3.select('#bathy-style').classed('disabled', true);
    bathyColorType = 'solid';
    hypsoColor.domain([0, max]);
  } else {
    d3.select('#solid-bathy-style').classed('disabled', true);
    d3.select('#bathy-style').classed('disabled', false);
    bathyColorType = 'bathy';
    hypsoColor.domain([0, max]);
  }
  d3.selectAll('#solid-bathy-style input, #bathy-style input').attr('disabled', null);
  d3.selectAll('.disabled input').attr('disabled', 'disabled');
  load(drawContours);
})

d3.select('#solid-bathy-color').on('change', function () {
  oceanColor = d3.event.detail;
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#bathy-low-color').on('change', function () {
  bathyColor.range([d3.event.detail, bathyColor.range()[1]]);
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.select('#bathy-high-color').on('change', function () {
  bathyColor.range([bathyColor.range()[0], d3.event.detail]);
  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
});

d3.selectAll('button[type="color"]').each(function() {
  var val = this.getAttribute('value');
  var el = this;
  var picker = new jscolor(this, {
    value: val,
    valueElement: null,
    closable: true,
    onFineChange: function () {
      var event = new CustomEvent('change', { detail: '#' + picker.toString() });
      el.dispatchEvent(event);
      d3.select('#' + el.id + '-text').node().value = toHex('#' + picker.toString());
    }
  });
  this.picker = picker;
});

d3.selectAll('.color-input').on('change', function () {
  var validColor = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(this.value);
  if (!validColor) return;
  switch (this.id) {
    case 'line-color-text':
    lineColor = this.value;
    break;

    case 'highlight-color-text':
    var rgba = toRGBA(this.value);
    highlightColor = rgba.slice(0, rgba.lastIndexOf(',')) + ',.5)';
    break;

    case 'shadow-color-text':
    shadowColor = this.value;
    break;

    case 'solid-color-text':
    solidColor = this.value;
    break;

    case 'hypso-low-color-text':
    hypsoColor.range([this.value, hypsoColor.range()[1]]);
    break;

    case 'hypso-high-color-text':
    hypsoColor.range([hypsoColor.range()[0], this.value]);
    break;

    case 'solid-bathy-color-text':
    oceanColor = this.value;
    break;

    case 'bathy-low-color-text':
    bathyColor.range([this.value, bathyColor.range()[1]]);
    break;

    case 'bathy-high-color-text':
    bathyColor.range([bathyColor.range()[0], this.value]);
    break;
  }

  d3.select('#' + this.id.replace('-text','')).node().picker.fromString(toHex(this.value));

  clearTimeout(wait);
  wait = setTimeout(function () { load(drawContours) },500);
})

d3.select('input[type="checkbox"]').on('change', function () {
  if (this.checked) referenceLayer.setOpacity(1);
  else referenceLayer.setOpacity(0);
});

d3.select('#download-geojson').on('click', downloadGeoJson);
d3.select('#download-png').on('click', downloadPNG);
d3.select('#download-svg').on('click', downloadSVG);

d3.selectAll('.icon-left-open').on('click', function () {
  d3.selectAll('.show').classed('show', false);
  d3.select('#wrapper').classed('panel-open', false);
});

// short delay before searching after key press, so we don't send too many requests
var searchtimer;
d3.select('#search input').on('keyup', function () {
  if (d3.event.keyCode == 13) {
    if (d3.selectAll('.search-result').size()) {
      var d = d3.select('.search-result').datum();
      map.fitBounds([[d.bbox[1], d.bbox[0]], [d.bbox[3], d.bbox[2]]]);
      d3.select('#search-results').style('display', 'none');
      d3.select('body').on('click.search', null);
      this.value = '';
      if (document.activeElement != document.body) document.activeElement.blur();
      return;
    }
  }
  clearTimeout(searchtimer);
  var val = this.value;
  searchtimer = setTimeout(function () {
    search(val);
  }, 250);
})

function search (val) {
  if (val.length < 2) {
    d3.select('#search-results').style('display', 'none')
      .selectAll('.search-result').remove();
    d3.select('body').on('click.search', null);
  }
  var geocodeURL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(val) + '.json?language=en&types=place,locality,neighborhood,poi&access_token=' + L.mapbox.accessToken;
  d3.json(geocodeURL, function (error, json) {
    if (json && json.features && json.features.length) {
      var restults = d3.select('#search-results').style('display', 'block')
        .selectAll('.search-result')
        .data(json.features, function (d) { return d.id });

      restults.enter()
        .append('div')
        .attr('class', 'search-result')
        .classed('highlight', function (d,i) { return i == 0})
        .html(function (d) { return d.place_name })
        .on('click', function (d) {
          if (d.bbox) map.fitBounds([[d.bbox[1], d.bbox[0]], [d.bbox[3], d.bbox[2]]]);
          else {
            map.setView(d.center.concat().reverse(), 11)
          }
          d3.select('#search-results').style('display', 'none');
          d3.select('body').on('click.search', null);
          d3.select('#search input').node().value = '';
          if (document.activeElement != document.body) document.activeElement.blur();
        });

      restults.exit().remove();

      d3.select('body').on('click.search', function () {
        if (d3.select('#search').node().contains(d3.event.target)) return;
        d3.select('#search-results').style('display', 'none');
        d3.select('body').on('click.search', null);
      });
    } else {
      d3.select('#search-results').style('display', 'none')
        .selectAll('.search-result').remove();
      d3.select('body').on('click.search', null);
    }
  });
}

var exampleLocations = [
  {name: 'Mount Fuji', coords: [35.3577, 138.7331, 13]},
  {name: 'Big Island, Hawaii', coords: [19.6801, -155.5132, 9]},
  {name: 'Grand Canyon', coords: [36.0469, -113.8416, 13]},
  {name: 'Mount Everest', coords: [27.9885, 86.9233, 12]},
  {name: 'Mount Rainier', coords:[46.8358, -121.7663, 11]},
  {name: 'White Mountains', coords:[44.0859, -71.4441, 11]}
];

var map_start_location = exampleLocations[Math.floor(Math.random()*exampleLocations.length)].coords;
var url_hash = window.location.hash.slice(1, window.location.hash.length).split('/');

if (url_hash.length == 3) {
    map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
    map_start_location = map_start_location.map(Number);
}

/* 
*
*
The good stuff starts from here 
*
*
*/

/* Set up the map*/

L.mapbox.accessToken = 'pk.eyJ1IjoiYXhpc21hcHMiLCJhIjoieUlmVFRmRSJ9.CpIxovz1TUWe_ecNLFuHNg';

var map = L.mapbox.map('map',null,{scrollWheelZoom: false});
var hash = new L.Hash(map);
map.setView(map_start_location.slice(0, 3), map_start_location[2]);

map.on('moveend', function() {
  // on move end we redraw the contour layer, so clear some stuff

  contourContext.clearRect(0,0,width,height);
  clearTimeout(wait);
  wait = setTimeout(getRelief,500);  // redraw after a delay in case map is moved again soon after
});

map.on('move', function() {
  // stop things so it doesn't redraw in the middle of panning
  clearTimeout(wait);
});

// custom tile layer for the Mapzen elevation tiles
// it returns div tiles but doesn't display anyting; images are saved but only drawn to an invisible canvas (demCanvas)
var CanvasLayer = L.GridLayer.extend({
  createTile: function(coords){
      var tile = L.DomUtil.create('div', 'leaflet-tile');
      var img = new Image();
      var self = this;
      img.crossOrigin = '';
      tile.img = img;
      img.onload = function() {
        // we wait for tile images to load before we can redraw the map
        clearTimeout(wait);
        wait = setTimeout(getRelief,500); // only draw after a reasonable delay, so that we don't redraw on every single tile load
      }
      img.src = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/'+coords.z+'/'+coords.x+'/'+coords.y+'.png'
      return tile;
  }
});
var demLayer = new CanvasLayer({attribution: '<a href="https://aws.amazon.com/public-datasets/terrain/">Elevation tiles</a> by Mapzen'}).addTo(map);

// custom map pane for the contours, above other layers
var pane = map.createPane('contour');
pane.appendChild(contourCanvas);

// custom map pane for the labels
var labelPane = map.createPane('labels');
var referenceLayer = L.mapbox.styleLayer('mapbox://styles/axismaps/cjerbqqik91q82sp3dax1py3c', {
  minZoom: 0,
  maxZoom: 15,
  pane: 'labels',
}).addTo(map);
reverseTransform();

// this resets our canvas back to top left of the window after panning the map
function reverseTransform() {
  var top_left = map.containerPointToLayerPoint([-buffer, -buffer]);
  L.DomUtil.setPosition(contourCanvas, top_left);
};

// this is to ensure the "loading" message gets a chance to show. show it then do the function (usually getRelief or drawContours) on next frame
function load (fn) {
  requestAnimationFrame(function () {
    d3.select('#loading').style('display', 'flex');
    requestAnimationFrame(fn);
  });
}

// after terrain tiles are loaded, kick things off by drawing them to a canvas
function getRelief(){
  load(function() {
    // reset canvases
    demContext.clearRect(0,0,width,height);
    reverseTransform();

    // reset DEM data by drawing elevation tiles to it
    for (var t in demLayer._tiles) {
      var rect = demLayer._tiles[t].el.getBoundingClientRect();
      demContext.drawImage(demLayer._tiles[t].el.img,rect.left + buffer,rect.top + buffer);
    }
    demImageData = demContext.getImageData(0,0,width,height);
    demData = demImageData.data;

    getContours();
  });
}

// calculate contours
function getContours () {
  var values = new Array(width*height);
  // get elevation values for pixels
  for (var y=0; y < height; y++) {
    for (var x=0; x < width; x++) {
      var i = getIndexForCoordinates(width, x,y);
      // x + y*width is the array position expected by the contours generator
      values[x + y*width] = Math.round(elev(i, demData) * (unit == 'ft' ? 3.28084 : 1));
    }
  }

  max = d3.max(values);
  min = d3.min(values);

  interval = +d3.select('#interval-input').node().value;

  max = Math.ceil(max/interval) * interval;
  min = Math.floor(min/interval) * interval;

  // the countour line values
  thresholds = [];
  for (var i = min; i <= max; i += interval) {
    thresholds.push(i);
  }
  contour.thresholds(thresholds);
  
  contoursGeoData = contour(values);  // this gets the contours geojson

  hypsoColor.domain([min,max]);

  // update the index line options based on the current interval
  d3.selectAll('#major option')
    .html(function () {
      if (+this.value == 0) return 'None';
      return +this.value * interval;
    });
  majorInterval = +d3.select('#major').node().value * interval;

  // show bathymetry options if elevations include values below zero
  d3.select('#bathymetry').style('display', min < 0 ? 'block' : 'none');
  if (min < 0) {
    bathyColor.domain([min, -1]);
    if (bathyColorType != 'none') {
      hypsoColor.domain([0, max]);
    }
  }

  drawContours();
}

// draw the map!
function drawContours(svg) {
  // svg option is for export
  if (svg !== true) { // this is the normal canvas drawing
    contourContext.clearRect(0,0,width,height);
    contourContext.save();
    if (type == 'illuminated') {
      contourContext.lineWidth = shadowSize + 1;
      contourContext.shadowBlur = shadowSize;
      contourContext.shadowOffsetX = shadowSize;
      contourContext.shadowOffsetY = shadowSize;

      contoursGeoData.forEach(function (c) {
        contourContext.beginPath();
        if (c.value >= 0 || bathyColorType == 'none') { // for values above sea level (or if we aren't styling bahymetry)
          contourContext.shadowColor = shadowColor;
          contourContext.strokeStyle = highlightColor;
          if (colorType == 'hypso') contourContext.fillStyle = hypsoColor(c.value);
          else if (colorType == 'solid') contourContext.fillStyle = solidColor;
          else contourContext.fillStyle = '#fff'; // fill can't really be transparent in this style, so "none" is actually white
        } else {
          // blue-ish shadow and highlight colors below sea level
          // no user option for these colors because I'm lazy
          contourContext.shadowColor = '#4e5c66';
          contourContext.strokeStyle = 'rgba(224, 242, 255, .5)';
          if (bathyColorType == 'bathy') contourContext.fillStyle = bathyColor(c.value);
          else if (bathyColorType == 'solid') contourContext.fillStyle = oceanColor;
          else contourContext.fillStyle = '#fff';
        }
        path(c);  // draws the shape
        // draw the light stroke first, then the fill with drop shadow
        // the effect is a light edge on side and dark on the other, giving the raised/illuminated contour appearance
        contourContext.stroke(); 
        contourContext.fill();
      });
    } else {  // regular contour lines
      contourContext.lineWidth = lineWidth;
      contourContext.strokeStyle = lineColor;
      if (colorType != 'hypso' && bathyColorType == 'none') {
        // no fill or solid fill. we don't have to fill/stroke individual contours, but rather can do them all at once
        contourContext.beginPath();
        contoursGeoData.forEach(function (c) {
          if (majorInterval == 0 || c.value % majorInterval != 0) path(c);
        });
        if (colorType == 'solid') {
          contourContext.fillStyle = solidColor;
          contourContext.fill();
        }
        contourContext.stroke();
      } else {
        // for hypsometric tints or a separate bathymetric fill, we have to fill contours one at a time
        contoursGeoData.forEach(function (c) {
          contourContext.beginPath();
          var fill;
          if (c.value >= 0 || bathyColorType == 'none') {
            if (colorType == 'hypso') fill = hypsoColor(c.value);
            else if (colorType == 'solid') fill = solidColor;
            else if (bathyColorType != 'none') fill = '#fff'; // to mask out ocean if ocean is colored
          } else {
            if (bathyColorType == 'bathy') fill = bathyColor(c.value);
            else if (bathyColorType == 'solid') fill = oceanColor;
          }
          path(c);
          if (fill) {
            contourContext.fillStyle = fill;
            contourContext.fill();
          }
          contourContext.stroke();
        });
      }
      
      // draw thicker index lines, if desired
      if (majorInterval != 0) {
        contourContext.lineWidth = lineWidthMajor;
        contourContext.beginPath();
        contoursGeoData.forEach(function (c) {
          if (c.value % majorInterval == 0) path(c);
        });
        contourContext.stroke();
      }

    }
    contourContext.restore();
  } else {
    // draw contours to SVG for export
    if (!contourSVG) {
      contourSVG = d3.select('body').append('svg');
    }
    contourSVG
      .attr('width', width)
      .attr('height', height)
      .selectAll('path').remove();

    contourSVG.selectAll('path.stroke')
      .data(contoursGeoData)
      .enter()
      .append('path')
      .attr('d', svgPath)
      .attr('stroke', type == 'lines' ? lineColor : highlightColor)
      .attr('stroke-width', function (d) {
        return type == 'lines' ? (majorInterval != 0 && d.value % majorInterval == 0 ? lineWidthMajor : lineWidth) : shadowSize;
      })
      .attr('fill', function (d) {
        if (d.value >= 0 || bathyColorType == 'none') {
          if (colorType == 'hypso') return hypsoColor(d.value);
          else if (colorType == 'solid') return solidColor;
          else if (bathyColorType != 'none') return '#fff'; // to mask out ocean if ocean is colored
        } else {
          if (bathyColorType == 'bathy') return bathyColor(d.value);
          else if (bathyColorType == 'solid') return oceanColor;
        }
        return 'none';
      })
      .attr('id', function (d) {
        return 'elev-' + d.value;
      });
  }
  d3.select('#loading').style('display', 'none');
}

function downloadGeoJson () {
  var geojson = {type: 'FeatureCollection', features: []};
  contoursGeoData.forEach(function (c) {
    var feature = {type:'Feature', properties:{elevation: c.value}, geometry: {type:c.type, coordinates:[]}};
    geojson.features.push(feature);
    c.coordinates.forEach(function (poly) {
      var polygon = [];
      feature.geometry.coordinates.push(polygon);
      poly.forEach(function (ring) {
        var polyRing = [];
        polygon.push(polyRing);
        ring.forEach(function (coord) {
          var ll = map.containerPointToLatLng(coord);
          polyRing.push([ll.lng, ll.lat]);
        });
      });
    })
  });
  download(JSON.stringify(geojson), 'countours.geojson');
}

function downloadPNG () {
  var newCanvas = document.createElement('canvas');
  newCanvas.width = width - 2*buffer;
  newCanvas.height = height - 2*buffer;
  newCanvas.getContext('2d').putImageData(contourContext.getImageData(0,0,width,height), -buffer, -buffer)
  // https://stackoverflow.com/questions/12796513/html5-canvas-to-png-file
  var dt = newCanvas.toDataURL('image/png');
  /* Change MIME type to trick the browser to downlaod the file instead of displaying it */
  dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');

  /* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
  dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');
  
  var tempLink = document.createElement('a');
  tempLink.style.display = 'none';

  newCanvas.toBlob(function(blob) {
    tempLink.href = window.URL.createObjectURL(blob);
    tempLink.download = 'contours.png';
    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank');
    }
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    //var linkText = document.createTextNode(canvas.width + "px");
    //a.appendChild(linkText);
  }, "image/png");

  
  // tempLink.href = dt;
  // tempLink.setAttribute('download', 'contours.png');
  // if (typeof tempLink.download === 'undefined') {
  //     tempLink.setAttribute('target', '_blank');
  // }
  
  

  /* For later - works better for large images?
// https://stackoverflow.com/questions/36918075/is-it-possible-to-programmatically-detect-size-limit-for-data-url

var makeButtonUsingBlob = function (canvas, a) {
  canvas.toBlob(function(blob) {
    a.href = window.URL.createObjectURL(blob);
    a.download = "example.jpg";
    var linkText = document.createTextNode(canvas.width + "px");
    a.appendChild(linkText);
  }, "image/jpeg", 0.7);
};

*/
}

function downloadSVG () {
  drawContours(true);
  var svgData = contourSVG.node().outerHTML;
  download(svgData, 'contours.svg', 'image/svg+xml;charset=utf-8')
}

// https://github.com/kennethjiang/js-file-download
function download(data, filename, mime) {
    var blob = new Blob([data], {type: mime || 'application/octet-stream'});
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
        // IE workaround for "HTML7007: One or more blob URLs were 
        // revoked by closing the blob for which they were created. 
        // These URLs will no longer resolve as the data backing 
        // the URL has been freed."
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        var blobURL = window.URL.createObjectURL(blob);
        var tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = blobURL;
        tempLink.setAttribute('download', filename); 
        
        // Safari thinks _blank anchor are pop ups. We only want to set _blank
        // target if the browser does not support the HTML5 download attribute.
        // This allows you to download files in desktop safari if pop up blocking 
        // is enabled.
        if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
        }
        
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blobURL);
    }
}

// convert elevation tile color to elevation value
function elev(index, demData) {
  if (index < 0 || demData[index] === undefined) return undefined;
  return (demData[index] * 256 + demData[index+1] + demData[index+2] / 256) - 32768;
}

// helper to get imageData index for a given x/y
function getIndexForCoordinates(width, x,y) {
  return width * y * 4 + 4 * x;
}

function toRGBA (color) {
  if (color.substr(0, 1) == '#') return hexToRGBA(color).replace(/\s/g, '');
  if (color.split(',').length == 4) return color.replace(/\s/g, ''); // already rgba
  return 'rgba' + color.substring(3, color.indexOf(')')).replace(/\s/g, '') + ',1)';
}

function hexToRGBA (hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 'rgba(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ',1)' : null;
}

function toHex (rgba) {
  if (rgba[0] == '#') {
    var vals = rgba.slice(1);
    if (vals.length == 3) {
      return '#' + vals[0] + vals[0] + vals[1] + vals[1] + vals[2] + vals[2];
    }
    return rgba;
  }
  var numbers = rgba.substr(rgba.indexOf('(') + 1, rgba.indexOf(')')).split(',').map(function (n) { return parseInt(n); });
  var r = numbers[0];
  var g = numbers[1];
  var b = numbers[2];
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}