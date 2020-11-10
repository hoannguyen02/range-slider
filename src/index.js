import './index.css';
let inputTag = null;
let slider = null;
let sliderWidth = 0;
let sliderLeft = 0;
let pointerWidth = 0;
let pointerR = null;
let pointerL = null;
let activePointer = null;
let selected = null;
let scaleEL = null;
let step = 0;
let tipL = null;
let tipR = null;

let values = {
  start: null,
  end: null,
};
let conf = {
  inputId: '',
  values: null,
  set: null,
  width: null,
  scale: false,
  labels: false,
  tooltip: false,
  step: null,
  disabled: false,
  onChange: null,
};

let cls = {
  container: 'rf-container rf-clearfix',
  background: 'rf-bg',
  selected: 'rf-selected',
  pointer: 'rf-pointer',
  scale: 'rf-scale',
  noscale: 'rf-noscale',
  tip: 'rf-tooltip',
};

for (var i in conf) {
  if (conf.hasOwnProperty(i)) conf[i] = conf[i];
}

export function init(config) {
  conf = config;
  if (!config.inputId) {
    console.error('Need to provide element with id to generate range filter');
    return;
  }
  inputTag = document.getElementById(conf.inputId.replace('#', ''));
  if (!inputTag) {
    console.error(`Cannot find input element with id ${config.inputId}`);
    return;
  }

  inputTag.style.display = 'none';

  // Todo validate min,max must be number
  if (
    !(conf.values.hasOwnProperty('min') && conf.values.hasOwnProperty('max'))
  ) {
    console.error(`Missing min or max value for range filter`);
    return;
  }
  createSlider();
}

function createSlider() {
  slider = createElement('div', cls.container);
  slider.innerHTML = '<div class="rf-bg"></div>';
  selected = createElement('div', cls.selected);
  pointerL = createElement('div', cls.pointer, ['dir', 'left']);
  scaleEL = createElement('div', cls.scale);

  if (conf.tooltip) {
    tipL = createElement('div', cls.tip);
    tipR = createElement('div', cls.tip);
    pointerL.appendChild(tipL);
  }
  slider.appendChild(selected);
  conf.scale && slider.appendChild(scaleEL);
  slider.appendChild(pointerL);

  pointerR = createElement('div', cls.pointer, ['dir', 'right']);
  if (conf.tooltip) pointerR.appendChild(tipR);
  slider.appendChild(pointerR);
  inputTag.parentNode.insertBefore(slider, inputTag.nextSibling);

  if (conf.width) slider.style.width = parseInt(conf.width) + 'px';
  sliderLeft = slider.getBoundingClientRect().left;
  sliderWidth = slider.clientWidth;
  pointerWidth = pointerL.clientWidth;

  setInitialValues();
}

function setInitialValues() {
  disabled(conf.disabled);

  conf.values = prepareArrayValues(conf);

  values.start = 0;
  values.end = conf.values.length - 1;

  if (conf.set && conf.set.length && checkInitial(conf)) {
    var vals = conf.set;
    values.start = conf.values.indexOf(vals[0]);
    values.end = conf.set[1] ? conf.values.indexOf(vals[1]) : null;
  }
  createScale();
}

function createScale(resize) {
  step = sliderWidth / (conf.values.length - 1);

  for (var i = 0, iLen = conf.values.length; i < iLen; i++) {
    var span = createElement('span'),
      ins = createElement('ins');

    span.appendChild(ins);
    scaleEL.appendChild(span);

    span.style.width = i === iLen - 1 ? 0 : step + 'px';

    if (!conf.labels) {
      if (i === 0 || i === iLen - 1) ins.innerHTML = conf.values[i];
    } else ins.innerHTML = conf.values[i];

    ins.style.marginLeft = (ins.clientWidth / 2) * -1 + 'px';
  }
  addEvents();
}

function addEvents() {
  var pointers = slider.querySelectorAll('.' + cls.pointer),
    pieces = slider.querySelectorAll('span');

  createEvents(document, 'mousemove touchmove', move.bind(this));
  createEvents(document, 'mouseup touchend touchcancel', drop.bind(this));

  for (var i = 0, iLen = pointers.length; i < iLen; i++)
    createEvents(pointers[i], 'mousedown touchstart', drag.bind(this));

  for (var i = 0, iLen = pieces.length; i < iLen; i++)
    createEvents(pieces[i], 'click', onClickPiece.bind(this));

  window.addEventListener('resize', onResize.bind(this));

  setValues();
}

function drag(e) {
  e.preventDefault();

  if (conf.disabled) return;

  var dir = e.target.getAttribute('data-dir');
  if (dir === 'left') activePointer = pointerL;
  if (dir === 'right') activePointer = pointerR;

  return slider.classList.add('sliding');
}

function move(e) {
  if (activePointer && !conf.disabled) {
    var coordX = e.type === 'touchmove' ? e.touches[0].clientX : e.pageX,
      index = coordX - sliderLeft - pointerWidth / 2;

    index = Math.round(index / step);

    if (index <= 0) index = 0;
    if (index > conf.values.length - 1) index = conf.values.length - 1;

    if (activePointer === pointerL) values.start = index;
    if (activePointer === pointerR) values.end = index;

    setValues();
  }
}

function drop() {
  activePointer = null;
}

function onClickPiece(e) {
  if (conf.disabled) return;

  var idx = Math.round((e.clientX - sliderLeft) / step);

  if (idx > conf.values.length - 1) idx = conf.values.length - 1;
  if (idx < 0) idx = 0;

  if (idx - values.start <= values.end - idx) {
    values.start = idx;
  } else {
    values.end = idx;
  }

  slider.classList.remove('sliding');

  return setValues();
}

function setValues(start, end) {
  var activePointer = 'start';

  if (start && conf.values.indexOf(start) > -1)
    values[activePointer] = conf.values.indexOf(start);

  if (end && conf.values.indexOf(end) > -1)
    values.end = conf.values.indexOf(end);

  if (values.start > values.end) values.start = values.end;

  pointerL.style.left = values[activePointer] * step - pointerWidth / 2 + 'px';

  if (conf.tooltip) {
    tipL.innerHTML = conf.values[values.start];
    tipR.innerHTML = conf.values[values.end];
  }

  inputTag.value = conf.values[values.start] + ',' + conf.values[values.end];
  pointerR.style.left = values.end * step - pointerWidth / 2 + 'px';

  if (values.end > conf.values.length - 1) values.end = conf.values.length - 1;
  if (values.start < 0) values.start = 0;

  selected.style.width = (values.end - values.start) * step + 'px';
  selected.style.left = values.start * step + 'px';

  onChange();
}

function onChange() {
  if (conf.onChange && typeof conf.onChange === 'function') {
    return conf.onChange(inputTag.value);
  }
}

function onResize() {
  sliderLeft = slider.getBoundingClientRect().left;
  sliderWidth = slider.clientWidth;
  return updateScale();
}

function updateScale() {
  step = sliderWidth / (conf.values.length - 1);

  var pieces = slider.querySelectorAll('span');

  for (var i = 0, iLen = pieces.length; i < iLen; i++)
    pieces[i].style.width = step + 'px';

  setValues();
}

function disabled(disabled) {
  conf.disabled = disabled;
  slider.classList[disabled ? 'add' : 'remove']('disabled');
}

function createElement(el, cls, dataAttr) {
  var element = document.createElement(el);
  if (cls) element.className = cls;
  if (dataAttr && dataAttr.length === 2)
    element.setAttribute('data-' + dataAttr[0], dataAttr[1]);

  return element;
}

function createEvents(el, ev, callback) {
  var events = ev.split(' ');

  for (var i = 0, iLen = events.length; i < iLen; i++)
    el.addEventListener(events[i], callback);
}

function prepareArrayValues(conf) {
  const values = [],
    range = conf.values.max - conf.values.min;

  if (!conf.step) {
    console.log('No step defined...');
    return [conf.values.min, conf.values.max];
  }

  for (var i = 0, iLen = range / conf.step; i < iLen; i++)
    values.push(conf.values.min + i * conf.step);

  if (values.indexOf(conf.values.max) < 0) values.push(conf.values.max);

  return values;
}

function checkInitial(conf) {
  if (!conf.set || conf.set.length < 1) return null;
  if (conf.values.indexOf(conf.set[0]) < 0) return null;

  if (conf.set.length < 2 || conf.values.indexOf(conf.set[1]) < 0) return null;
  return true;
}
