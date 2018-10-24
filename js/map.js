window.mapLayers = {
  'map-osm': new ol.layer.Tile({
    source: new ol.source.OSM()
  }),
  'map-cz-base-10': new ol.layer.Tile({
    extent: [1336730.750651,6187118.817515,2116999.935386,6635957.047606],
    source: new ol.source.TileWMS({
      url: 'https://geoportal.cuzk.cz/WMS_ZM10_PUB/service.svc/get',
      params: {
        'LAYERS': 'GR_ZM10'
      }
    })
  }),
  'map-cz-ortofoto': new ol.layer.Tile({
    extent: [1336730.750651,6187118.817515,2116999.935386,6635957.047606],
    source: new ol.source.TileWMS({
      url: 'https://geoportal.cuzk.cz/WMS_ORTOFOTO_PUB/service.svc/get',
      params: {
        'LAYERS': 'GR_ORTFOTORGB'
      }
    })
  })
}

var styleFunction = function(feature) {
  var geometry = feature.getGeometry();
  var styles = [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#000',
      width: 2
    }),
    image: new ol.style.Circle({
      radius: 3,
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      })
    })
  })];
  if (geometry.getType() == 'LineString') {
    geometry.forEachSegment(function(start, end) {
      styles.push(new ol.style.Style({
        geometry: new ol.geom.Point(start),
        image: new ol.style.Circle({
          radius: 3,
          fill: new ol.style.Fill({
            color: 'rgb(24, 152, 255)'
          }),
          stroke: new ol.style.Stroke({
            color: '#000',
            width: 1.5
          })
        })
      }));
      styles.push(new ol.style.Style({
        geometry: new ol.geom.Point(end),
        image: new ol.style.Circle({
          radius: 3,
          fill: new ol.style.Fill({
            color: '#000'
          }),
          stroke: new ol.style.Stroke({
            color: '#000',
            width: 1.5
          })
        })
      }));
    });
  }

  return styles;
}

var source = new ol.source.Vector();

var vector = new ol.layer.Vector({
  source: source,
  style: styleFunction
});


/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var sketch;


/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;


/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;

var mapElement = document.getElementById('map');

var clearMapDisabled = false;

var map = new ol.Map({
  layers: [window.mapLayers['map-osm'], vector],
  target: 'map',
  view: new ol.View({
    center: [1709743, 6402365],
    zoom: 7
  }),
  controls: ol.control.defaults({
    attribution: false,
    rotate: false,
    zoomOptions: {
      target: 'map-controls'
    }
  }),
  interactions: ol.interaction.defaults({
    altShiftDragRotate:false,
    pinchRotate:false
  })
});

var layerSwitcher = new ol.control.Control({
  element: document.getElementById('layer-switcher'),
  target: 'map-controls'
});
map.addControl(layerSwitcher);

var draw; // global so we can remove it later

var valueUnitInput = $('#input-value-unit');
var systemInput = $('#input-system');
var unitInput = $('#input-unit');

/**
 * Format length output.
 * @param {ol.geom.LineString} line The line.
 * @return {string} The formatted length.
 */
var formatLength = function(line) {
  var length = ol.Sphere.getLength(line);

  clearMapDisabled = true;
  systemInput.val(systemForMap);
  systemInput.trigger('change');
  unitInput.val(unitForMap);
  unitInput.trigger('change');
  valueUnitInput.val(Math.round(length / 1000 * 100) / 100);
  valueUnitInput.trigger('keyup');
  clearMapDisabled = false;
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
        ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
        ' ' + 'm';
  }
  return output;
};


function addInteraction() {
  draw = new ol.interaction.Draw({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ ('LineString'),
    maxPoints: 2,
    style: styleFunction
  });
  map.addInteraction(draw);

  createMeasureTooltip();
  createHelpTooltip();

  var listener;
  draw.on('drawstart',
      function(evt) {
        source.clear(true);
        createMeasureTooltip();
        // set sketch
        sketch = evt.feature;

        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = evt.coordinate;

        listener = sketch.getGeometry().on('change', function(evt) {
          var geom = evt.target;
          var output = formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
          measureTooltipElement.innerHTML = output;
          measureTooltip.setPosition(tooltipCoord);
        });
      }, this);

  draw.on('drawend',
      function() {
        measureTooltip.setOffset([2, -2]);
        // unset sketch
        sketch = null;
        ol.Observable.unByKey(listener);
      }, this);
}


/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'tooltip hidden';
  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [2, -2],
    positioning: 'bottom-left'
  });
  map.addOverlay(helpTooltip);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'tooltip tooltip-measure';
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [2, -2],
    positioning: 'bottom-left'
  });
  map.addOverlay(measureTooltip);
}

function clearMap() {
  if (clearMapDisabled) {
    return;
  }
  source.clear(true);
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    measureTooltipElement = null;
  }
}

function switchLayer(id) {
  var layer = window.mapLayers[id];
  map.getLayers().removeAt(0);
  map.getLayers().insertAt(0, layer);
  if (layer.getExtent()) {
    var center;
    var zoom;
    var extent = layer.getExtent();

    if (ol.extent.containsCoordinate(extent, map.getView().getCenter())) {
      center = map.getView().getCenter();
      zoom = map.getView().getZoom();
    } else {
      center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      zoom = 7;
    }

    map.setView(new ol.View({
      extent: extent,
      center: center,
      zoom: zoom
    }));
  } else {
    map.setView(new ol.View({
      center: map.getView().getCenter(),
      zoom: map.getView().getZoom()
    }));
  }
}

addInteraction();

var xhr;
$('#search-location').autoComplete({
  delay: 500,
  source: function(term, suggest) {
    try { xhr.abort(); } catch(e){}
    xhr = $.getJSON('https://api.opencagedata.com/geocode/v1/json', {
      q: term,
      key: '5aa73ae4e27b43248135d8817205efb4'
    },
    function (data) {
      var suggestions = data.results.map(function(result) {
        if (result.bounds) {
          var northEast = result.bounds.northeast;
          var southWest = result.bounds.southwest;
          northEast = ol.proj.fromLonLat([northEast.lng, northEast.lat]);
          southWest = ol.proj.fromLonLat([southWest.lng, southWest.lat]);
          var minx = Math.min(northEast[0], southWest[0]);
          var miny = Math.min(northEast[1], southWest[1]);
          var maxx = Math.max(northEast[0], southWest[0]);
          var maxy = Math.max(northEast[1], southWest[1]);
          return {
            text: result.formatted,
            extent: [minx, miny, maxx, maxy]
          }
        } else if (result.geometry) {
          var geom = ol.proj.fromLonLat([result.geometry.lng, result.geometry.lat]);
          return {
            text: result.formatted,
            extent: [geom[0], geom[1], geom[0], geom[1]]
          }
        } else {
          return null;
        }
      }).filter(function (x) { return x != null });
      suggest(suggestions);
    });
  },
  renderItem: function(item, search) {
    search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
        return '<div class="autocomplete-suggestion" data-extent="' + JSON.stringify(item.extent) +'" data-lng="'+item.lng+'">'+item.text.replace(re, "<b>$1</b>")+'</div>';
  },
  onSelect: function(e, term, item) {
    var extent = item.data('extent');
    map.getView().fit(extent, {
      maxZoom: 20,
      duration: 1000
    });
  }
});
