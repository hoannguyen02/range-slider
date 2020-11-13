import './index.css';

const cls = {
  container: 'rf-container rf-clearfix',
  background: 'rf-bg',
  selected: 'rf-selected',
  pointer: 'rf-pointer',
};

export function init(config) {
  let inputTag = null;
  let slider = null;
  let sliderWidth = 0;
  let sliderLeft = 0;
  let pointerWidth = 0;
  let pointerR = null;
  let pointerL = null;
  let activePointer = null;
  let selected = null;
  let step = 0;
  let canMove = true;
  let emitChange = true;
  let firstRender = true;
  let secondeRender = false;
  // TODO: Rename values bellow for better understand
  let values = {
    start: null,
    end: null,
  };
  let conf = {
    inputId: '',
    values: [],
    set: [],
    width: null,
    step: null,
    onChange: null,
  };

  for (var i in conf) {
    if (conf.hasOwnProperty(i)) conf[i] = conf[i];
  }

  conf = config;
  if (!config.inputId) {
    console.error('Need to provide element with id to generate range filter');
    return;
  }
  inputTag = document.getElementById(conf.inputId);
  if (!inputTag) {
    console.error(`Cannot find input element with id ${config.inputId}`);
    return;
  }

  // Todo validate min,max must be number
  if (conf.min === undefined || conf.min === undefined) {
    console.error(`Missing min or max value for range filter`);
    return;
  }

  // Create slider
  slider = createElement('div', cls.container);
  slider.innerHTML = '<div class="rf-bg"></div>';
  selected = createElement('div', cls.selected);
  pointerL = createElement('div', cls.pointer, ['dir', 'left']);
  slider.appendChild(selected);
  slider.appendChild(pointerL);

  pointerR = createElement('div', cls.pointer, ['dir', 'right']);
  slider.appendChild(pointerR);
  inputTag.parentNode.insertBefore(slider, inputTag.nextSibling);

  sliderLeft = slider.getBoundingClientRect().left;
  sliderWidth = slider.clientWidth;
  pointerWidth = pointerL.clientWidth;

  // Set values
  conf.values = prepareArrayValues();
  values.start = conf.min;
  values.end = conf.max;
  // Initial value from set
  if (conf.set && conf.set.length > 0) {
    const [from, to] = conf.set;
    values.start = conf.values.indexOf(from);
    values.end = conf.values.indexOf(to);
  }

  step = sliderWidth / (conf.values.length - 1);

  setValues();

  // Add events
  createEvents(document, 'mousemove touchmove', move.bind(this));
  createEvents(document, 'mouseup touchend touchcancel', drop.bind(this));

  const pointers = slider.querySelectorAll('.' + cls.pointer);
  for (let i = 0, iLen = pointers.length; i < iLen; i++)
    createEvents(pointers[i], 'mousedown touchstart', drag.bind(this));

  window.addEventListener('resize', onResize.bind(this));

  function drag(e) {
    e.preventDefault();
    let dir = e.target.getAttribute('data-dir');
    if (dir === 'left') activePointer = pointerL;
    if (dir === 'right') activePointer = pointerR;
  }

  function move(e) {
    if (activePointer && !conf.disabled) {
      let coordX = e.type === 'touchmove' ? e.touches[0].clientX : e.pageX,
        index = coordX - sliderLeft - pointerWidth / 2;

      index = Math.round(index / step);
      if (index <= 0) index = 0;
      if (index > conf.values.length - 1) index = conf.values.length - 1;

      // Won't set values and emit if index greater smaller than start or greater than end again
      if (index === 0 || index === conf.values.length - 1) {
        if (!canMove && emitChange) {
          emitChange = false;
        }
        canMove = false;
      } else {
        emitChange = true;
        canMove = true;
      }

      const { start, end } = values;
      let newStart = start,
        newEnd = end;

      if (emitChange) {
        if (activePointer === pointerL) {
          newStart = index;
          if (secondeRender) {
            newEnd = conf.values.length - 1;
            secondeRender = false;
          }
        } else {
          newEnd = index;
        }
        // Won't set values and emit if the same values
        if (!firstRender && newStart === start && newEnd === end) {
          return;
        } else {
          values.start = newStart;
          values.end = newEnd;
        }

        setValues();
        onChange();
      }
    }
  }

  function drop() {
    activePointer = null;
  }

  function setValues() {
    if (values.start > values.end) {
      values.start = values.end;
      pointerL.style.left =
        values['start'] * step > 0
          ? values.end * step - pointerWidth / 2 + 'px'
          : -16 + 'px';
    } else if (values.start === values.end) {
      pointerL.style.left =
        values['start'] * step > 0
          ? values.end * step - pointerWidth / 2 + 'px'
          : -16 + 'px';
    } else {
      pointerL.style.left =
        values['start'] * step > 0
          ? values['start'] * step - pointerWidth / 2 + 'px'
          : -16 + 'px';
    }

    inputTag.value = `${conf.values[values.start]},${conf.values[values.end]}`;

    const [from, to] = conf.set;
    if (firstRender && from === to && (from === conf.min || from < conf.min)) {
      firstRender = false;
      secondeRender = true;
      pointerR.style.left =
        (conf.values.length - 1) * step - (pointerWidth / 2 - 1) + 'px';
    } else {
      pointerR.style.left =
        values.end * step > 0
          ? values.end * step - (pointerWidth / 2 - 1) + 'px'
          : -16 + 'px';
    }

    selected.style.width = (values.end - values.start) * step + 'px';
    selected.style.left = values.start * step + 'px';
  }

  function onChange() {
    if (conf.onChange && typeof conf.onChange === 'function') {
      conf.onChange(inputTag.value);
    }
  }

  function createElement(el, cls, dataAttr) {
    const element = document.createElement(el);
    if (cls) element.className = cls;
    if (dataAttr && dataAttr.length === 2)
      element.setAttribute('data-' + dataAttr[0], dataAttr[1]);

    return element;
  }

  function createEvents(el, ev, callback) {
    const events = ev.split(' ');

    for (let i = 0, iLen = events.length; i < iLen; i++)
      el.addEventListener(events[i], callback);
  }

  function prepareArrayValues() {
    const values = [],
      range = conf.max - conf.min;

    if (!conf.step) {
      console.log('No step defined...');
      return [conf.min, conf.max];
    }

    for (let i = 0, iLen = range / conf.step; i < iLen; i++)
      values.push(conf.min + i * conf.step);

    if (values.indexOf(conf.max) < 0) values.push(conf.max);

    return values;
  }

  function onResize() {
    sliderLeft = slider.getBoundingClientRect().left;
    sliderWidth = slider.clientWidth;
    step = sliderWidth / (conf.values.length - 1);
    setValues();
  }
}
