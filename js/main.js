var lang = $('#lang-switcher').val();

var valueMmInput = $('#input-value-mm');
var valueUnitInput = $('#input-value-unit');
var systemInput = $('#input-system');
var unitInput = $('#input-unit');
var valueOutput = $('#output-value');
var layerSwitcher = $('#layer-switcher');

var systemMap = {};
systems.forEach(function(system) {
  var unitMap = {};

  system.units.forEach(function(unit) {
    unitMap[unit.id] = unit;
  });

  system.unitMap = unitMap;
  systemMap[system.id] = system;
});

valueMmInput.on('keyup', function() {
  updateOutput();
});

valueUnitInput.on('keyup', function() {
  updateOutput();
  clearMap();
});

systemInput.on('change', function() {
  updateUnits(systemInput.val());
  updateOutput();
  clearMap();
});

unitInput.on('change', function() {
  updateOutput();
  clearMap();
});

$('#output-prefix').on('click', function(e) {
  select(e.target.parentElement);
});

$('#output-value').on('click', function(e) {
  select(e.target);
});

function select(element) {
  var range = document.createRange();
  range.selectNodeContents(element);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  try {
    document.execCommand('copy');
  } catch (err) {
  }
};

systems.forEach(function(system) {
  systemInput.append($('<option>', {
    'value': system.id,
    'data-text-ref': system.id
  }));
});

updateUnits(systemInput.val());

for (var k in window.mapLayers) {
  layerSwitcher.append($('<option>', {
    'value': k,
    'data-text-ref': k
  }));
}

layerSwitcher.on('change', function() {
  switchLayer(layerSwitcher.val());
});

updateTexts();

updateOutput();

function updateOutput() {
  var systemId = systemInput.val();
  var unitId = unitInput.val();
  var ratio = parseFloat(systemMap[systemId].unitMap[unitId].value);
  var inputMm = parseFloat(valueMmInput.val().replace(',', '.'));
  var inputUnit = parseFloat(valueUnitInput.val().replace(',', '.'));

  if (inputMm === NaN || inputUnit === NaN) {
    valueOutput.empty();
  } else {
    var value = Math.round(inputUnit * ratio / inputMm);
    valueOutput.empty().append(value);
  }
}

function updateUnits(systemId) {
  var system = systemMap[systemId];
  unitInput.empty();
  system.units.forEach(function(unit) {
    unitInput.append($('<option>', {
      value: unit.id,
      'data-text-ref': unit.id
    }));
  });
  updateTexts();
}

$('#lang-switcher').on('change', function(e) {
  var lang = $(e.target).val();
  switchLang(lang);
});

function switchLang(l) {
  lang = l;
  updateTexts(function () {
    updateTabSize();
  });
}

function updateTexts(callback) {
  var textLocators = [getTextFromJSON, getTextFromFile];

  var textsToTranslate = $('[data-text-ref]').length;

  $('[data-text-ref]').each(function (i, e) {
    var e = $(e);
    var key = e.attr('data-text-ref');

    var updateText = function(text) {
      var target = e.attr('data-text-target');
      if (target) {
        e.attr(target, text);
      } else {
        e.html(text);
      }
      e.removeClass(function (index, classes) {
        return classes
                .split(' ')
                .filter(function(cls) {return cls.startsWith('lang-')})
                .join(' ');
      });
      e.addClass('lang-' + lang);
      textsToTranslate--;
      if (textsToTranslate == 0 && callback) {
        callback();
      }
    }

    textLocators.some(function(locator) {
      return locator(key, lang, updateText);
    });
  });
}

function getTextFromJSON(key, lang, callback) {
  var text = texts[key];
  if (text) {
    callback(text[lang]);
    return true;
  } else {
    return false;
  }
}

function getTextFromFile(key, lang, callback) {
  var url = 'data/texts/' + lang + '/' + key + '.html';
  $.ajax({
    url: url,
    dataType: 'html',
    success: callback,
    error: function(xhr, status, error) {
      console.error('Loading of text from "' + url + '" was not successful. Status: ' + status + ' Error: ' + error);
    }
  });
  return true;
}
