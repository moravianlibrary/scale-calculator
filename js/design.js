$(function() {
  updateTabSize();
  addSlashBetweenZoomButtons();
});
$(window).on('resize', updateTabSize);

$('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
  if (e.target.id == 'authors-tab') {
    dectivateMainTabs();
  } else {
    deactiveAuthorsTab();
  }
  updateTabSize();
});

function dectivateMainTabs() {
  $('.nav-tabs a').removeClass('active');
}

function deactiveAuthorsTab() {
  $('#authors-tab').removeClass('active');
}

function updateTabSize() {
  var windowHeight = $(window).height();
  var tab = $('.tab-pane.active');
  var padding = $('#pannel-padding')
  var footer = $('#footer');
  // reset heights before doing any calculations
  padding.css('height', '0px');
  tab.css('height', 'auto');
  var tabPosition = tab.position();
  var tabHeight = tab.height() + footer.height();

  if (tabPosition.top + tabHeight > windowHeight) {
    var newTabHeight = (windowHeight - tabPosition.top) - footer.height();
    tab.css('height', Math.round(newTabHeight) + 'px');
    tab.css('overflow-y', 'scroll');
  } else {
    var footerOffset = footer.offset();
    var footerBottom = footerOffset.top + footer.height();
    var paddingHeight = Math.round(windowHeight - footerBottom);
    padding.css('height', paddingHeight + 'px');
    tab.css('height', 'auto');
    tab.css('overflow-y', 'hidden');
  }
}

function addSlashBetweenZoomButtons() {
  $('.ol-zoom.ol-control button.ol-zoom-in').after('<span>/</span>')
}
