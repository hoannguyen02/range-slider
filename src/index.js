import './index.css';
import { debounce } from './debounce';

if (!window.debounce) {
  window.debounce = debounce;
}
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
  let pointerTemp = null;
  let activePointer = null;
  let selected = null;
  let step = 0;
  let canMove = true;
  let emitChange = true;
  let firstRender = true;
  let secondeRender = false;
  let fromLeft = null;
  let toLeft = null;
  // Check to emit left, right or both
  let firstLeftEmit = false;
  let firstRightEmit = false;
  // TODO: Rename values bellow for better understand
  let values = {
    start: null,
    end: null,
  };
  let conf = {
    inputId: '',
    values: [],
    min: null,
    max: null,
    set: [],
    width: null,
    step: null,
    onChange: null,
    fromEL: null,
    toEL: null,
  };

  // Decide to choose which pointer incase they're place together between min and max
  let currentIndex = null;
  let pointerPlaceTogether = false;
  let counter = 0;

  for (var i in conf) {
    if (conf.hasOwnProperty(i)) conf[i] = config[i];
  }
  // Validate input element
  if (!conf.inputId) {
    console.error('Need to provide element with id to generate range filter');
    return;
  }
  inputTag = document.getElementById(conf.inputId);
  if (!inputTag) {
    console.error(`Cannot find input element with id ${conf.inputId}`);
    return;
  }
  // Add input events to input elements
  if (conf.fromEL) {
    createEvents(
      conf.fromEL,
      'keyup mouseup',
      debounce(function(event) {
        onInput(parseInt(event.target.value), true);
      }, 500)
    );
  }

  if (conf.toEL) {
    createEvents(
      conf.toEL,
      'keyup change',
      debounce(function(event) {
        onInput(parseInt(event.target.value), false);
      }, 500)
    );
  }

  // Todo validate min,max must be number
  if (conf.min === undefined || conf.max === undefined) {
    console.error(`Missing min or max value for range filter`);
    return;
  }

  // Create slider
  slider = createElement('div', cls.container);
  slider.innerHTML = '<div class="rf-bg"></div>';
  selected = createElement('div', cls.selected);
  slider.appendChild(selected);
  // Pointers
  pointerL = createElement('div', cls.pointer, ['dir', 'left']);
  slider.appendChild(pointerL);
  pointerR = createElement('div', cls.pointer, ['dir', 'right']);
  slider.appendChild(pointerR);
  pointerTemp = createElement('div', cls.pointer, ['dir', 'temp']);
  pointerTemp.style.cssText = 'display: none; z-index: 2';
  slider.appendChild(pointerTemp);
  inputTag.parentNode.insertBefore(slider, inputTag.nextSibling);

  sliderLeft = slider.getBoundingClientRect().left;
  sliderWidth = slider.clientWidth;
  pointerWidth = pointerL.clientWidth;

  // Values
  conf.values = prepareArrayValues();
  // Step
  step = sliderWidth / (conf.values.length - 1);
  // Initial value from set
  if (conf.set && conf.set.length > 0) {
    const [from, to] = conf.set;
    values.start = conf.values.indexOf(from);
    values.end =
      to > conf.min ? conf.values.indexOf(to) : conf.values.length - 1;
    if (from > conf.min) {
      conf.fromEL.value = from;
    }
    if (to > conf.min) {
      conf.toEL.value = to;
    }
    if (
      (from !== 0 || to !== 0) &&
      (conf.values.indexOf(from) === -1 || conf.values.indexOf(to) === -1)
    ) {
      setValuesBasedOnInput(from, to);
    } else {
      setValuesBasedOnPointer();
    }
  }

  // Add events
  createEvents(document, 'mousemove touchmove', onMove);
  createEvents(document, 'mouseup touchend touchcancel', onDrop);

  const pointers = slider.querySelectorAll('.' + cls.pointer);
  for (let i = 0, iLen = pointers.length; i < iLen; i++)
    createEvents(pointers[i], 'mousedown touchstart', onDrag);

  // window.addEventListener('resize', onResize);

  function setValuesBasedOnInput(from, to) {
    fromLeft = from === conf.min || from === 0 ? -8 : calcLeft(from);
    pointerL.style.left = fromLeft - pointerWidth / 2 + 'px';
    toLeft = to === conf.min || to === 0 ? calcLeft(conf.max) : calcLeft(to);
    pointerR.style.left = toLeft - (pointerWidth / 2 - 1) + 'px';
    selected.style.width = toLeft - fromLeft + 'px';
    selected.style.left = fromLeft + 'px';
  }

  function setValuesBasedOnPointer() {
    if (values.start > values.end) {
      values.start = values.end;
      const pointerStyle =
        values['start'] * step > 0
          ? values.end * step - pointerWidth / 2 + 'px'
          : -16 + 'px';
      pointerL.style.left = pointerStyle;
      pointerTemp.style.left = pointerStyle;
    } else if (values.start === values.end) {
      const pointerStyle =
        values['start'] * step > 0
          ? values.end * step - pointerWidth / 2 + 'px'
          : -16 + 'px';
      pointerL.style.left = pointerStyle;
      pointerTemp.style.left = pointerStyle;
    } else {
      const pointerStyle =
        values['start'] * step > 0
          ? values['start'] * step - pointerWidth + 'px'
          : -16 + 'px';
      pointerL.style.left = pointerStyle;
      pointerTemp.style.left = pointerStyle;
    }

    if (firstLeftEmit && firstRightEmit) {
      inputTag.value = JSON.stringify({
        start: conf.values[values.start],
        end: conf.values[values.end],
      });
    } else if (firstLeftEmit) {
      inputTag.value = JSON.stringify({
        start: conf.values[values.start],
        end: undefined,
      });
    } else if (firstRightEmit) {
      inputTag.value = JSON.stringify({
        start: undefined,
        end: conf.values[values.end],
      });
    } else {
      // Won't set value
    }

    const [from, to] = conf.set;
    if (firstRender && from === to && (from === conf.min || from < conf.min)) {
      firstRender = false;
      secondeRender = true;
      const pointerStyle =
        (conf.values.length - 1) * step - pointerWidth / 2 + 1 + 'px';
      pointerR.style.left = pointerStyle;
      pointerTemp.style.left = pointerStyle;
      selected.style.width = sliderWidth + 'px';
      selected.style.left = 0 + 'px';
    } else {
      const pointerStyle =
        values.end * step > 0
          ? values.end * step - pointerWidth / 2 + 1 + 'px'
          : -16 + 'px';
      pointerR.style.left = pointerStyle;
      pointerTemp.style.left = pointerStyle;
      selected.style.width = (values.end - values.start) * step + 'px';
      selected.style.left = values.start * step + 'px';
    }
  }

  function calcLeft(value) {
    return (sliderWidth * (value - conf.min)) / (conf.max - conf.min);
  }

  function onInput(inputVal, start) {
    let value = inputVal;
    // Make sure it valid value
    if (value < conf.max && value > conf.min) {
      const [from, to] = conf.set;
      if (toLeft === null) toLeft = sliderWidth;
      if (fromLeft === null) fromLeft = 0;
      /**
       *    x1(value) - min         x2
       *    ---------------- = --------------- => x2 = sliderWidth*(value - min)/(max-min)
       *       max - min        sliderWidth
       */
      if (start) {
        if (values.end !== 0 && value > conf.values[values.end]) return;
        if (to > conf.min) {
          toLeft = calcLeft(to);
        }
        fromLeft = calcLeft(value);
        pointerL.style.left = fromLeft - pointerWidth / 2 + 'px';
      } else {
        if (value < conf.values[values.start]) return;
        if (from > conf.min) {
          fromLeft = calcLeft(from);
        }
        toLeft = calcLeft(value);
        pointerR.style.left = toLeft - (pointerWidth / 2 - 1) + 'px';
      }
      selected.style.width = toLeft - fromLeft + 'px';
      selected.style.left = fromLeft + 'px';
    }
  }

  function onDrag(e) {
    e.preventDefault();
    let dir = e.target.getAttribute('data-dir');
    if (dir === 'left') {
      activePointer = pointerL;
      firstLeftEmit = true;
    }
    if (dir === 'right') {
      activePointer = pointerR;
      firstRightEmit = true;
    }
    if (dir === 'temp') {
      activePointer = pointerTemp;
      firstLeftEmit = true;
      firstRightEmit = true;
    }
  }

  function onDrop() {
    activePointer = null;
    pointerTemp.style.display = 'none';
    // Check condition if both pointer place together at min/max
    if (values.end === 0) {
      pointerL.style.zIndex = '0';
      pointerR.style.zIndex = '1';
    }
    if (values.start === conf.values.length - 1) {
      pointerL.style.zIndex = '1';
      pointerR.style.zIndex = '0';
    }
    if (values.start === values.end) {
      pointerPlaceTogether = true;
      pointerTemp.style.left = values.end * step - pointerWidth / 2 + 'px';
      pointerTemp.style.display = 'block';
    }
  }

  function onMove(e) {
    if (activePointer && !conf.disabled) {
      let coordX = e.type === 'touchmove' ? e.touches[0].clientX : e.pageX,
        index = coordX - sliderLeft - pointerWidth / 2;

      index = Math.round(index / step);
      if (index <= 0) index = 0;
      if (index > conf.values.length - 1) index = conf.values.length - 1;

      if (pointerPlaceTogether) {
        counter++;
        if (counter === 22) {
          counter = 0;
          if (index > currentIndex) {
            activePointer = pointerR;
          } else {
            activePointer = pointerL;
          }
          pointerPlaceTogether = false;
        }
        pointerTemp.style.left = index * step - pointerWidth + 'px';
      } else {
        // Keep current index to decide to choose active pointer incase both place together in between min and max
        currentIndex = index;
        // Won't set values and emit if index smaller than start or greater than end again
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
            if (secondeRender) {
              secondeRender = false;
            }
            newEnd = index;
          }
          // Won't set values and emit if the same values
          if (!firstRender && newStart === start && newEnd === end) {
            return;
          } else {
            values.start = newStart;
            values.end = newEnd;
          }

          setValuesBasedOnPointer();
          onChange();
        }
      }
    }
  }

  function onChange() {
    if (conf.onChange && typeof conf.onChange === 'function') {
      conf.onChange(JSON.parse(inputTag.value));
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
    setValuesBasedOnPointer();
  }
}
