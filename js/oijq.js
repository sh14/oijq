'use strict'

function cl (data, clear) {
  if (true === clear) {
    console.clear()
  }
  console.log(data)
}

/**
 * Автоматическое изменение высоты под текст внутри textarea
 *
 * @param textarea
 * @returns {boolean}
 */
function resizeTextarea (textarea) {
  if ('textarea' !== textarea.tagName.toLowerCase()) {
    return false
  }
  textarea.style.height = '0px'
  textarea.style.height = textarea.scrollHeight + 'px'
}

/**
 * Функция постановки задач в очередь. Функции выполняются по очереди, это сделано для сокращения кол-ва таймеров
 * до одного, с целью предотвращения зависания.
 *
 * Использование:
 * Scheduler.add( <имя_функции>, null, 1000, false );
 */
let Scheduler = (function () {
  let tasks      = []
  let minimum    = 10
  let timeoutvar = null
  let output     = {
    add: function (func, context, timer, once) {
      let iTimer = parseInt(timer)
      context    = context && typeof context === 'object' ? context : null
      if (typeof func === 'function' && !isNaN(iTimer) && iTimer > 0) {
        tasks.push([func, context, iTimer, iTimer * minimum, once])
      }
    },
    remove: function (func, context) {
      for (let i = 0, l = tasks.length; i < l; i++) {
        if (tasks[i][0] === func && (tasks[i][1] === context || tasks[i][1] == null)) {
          tasks.splice(i, 1)
          return
        }
      }
    },
    halt: function () {
      if (timeoutvar) {
        clearInterval(timeoutvar)
      }
    }
  }
  let schedule   = function () {
    for (let i = 0, l = tasks.length; i < l; i++) {
      if (tasks[i] instanceof Array) {
        tasks[i][3] -= minimum
        if (tasks[i][3] < 0) {
          tasks[i][3] = tasks[i][2] * minimum
          tasks[i][0].apply(tasks[i][1])
          if (tasks[i][4]) {
            tasks.splice(i, 1)
          }
        }
      }
    }
  }
  timeoutvar     = setInterval(schedule, minimum)
  return output
})()

/**
 * Check if given string is an URL
 *
 * @param str
 * @returns {boolean}
 */
function isUrl (str) {
  let pattern = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
  return pattern.test(str)
}

/**
 * Set page URL
 *
 * @param data
 * @param url
 */
function setUrl (data, url) {
  document.title = data.title
  window.history.pushState({ 'html': data.html, 'pageTitle': data.title }, '', url)
}

/**
 * Scroll to a given element
 *
 * @param element
 * @param scrollOffset
 */
function scrollCloseTo (element, scrollOffset) {
  if (!scrollOffset) {
    scrollOffset = 0
  }
  let y = element.offsetTop + scrollOffset
  window.scrollTo(0, y)
}

/**
 * Add event listner
 *
 * @param event
 * @param selector
 * @param callback
 */
function on (event, selector, callback) {
  event = event.split(' ')
  for (let i = 0, count = event.length; i < count; i++) {
    document.addEventListener(event[i], function (e) {
      let element = e.target
      // if the element or the closest one was involved
      if (element.closest(selector)) {
        // pass variables to callback function
        callback(e, selector)
      }
    }, true)
  }
}

/**
 * Function, that put the data to template block, and return complete HTML.
 *
 * @param str
 * @param data
 * @returns {Function}
 */
function tmpl (str, data) {
  // Figure out if we're getting a template, or if we need to
  // load the template - and be sure to cache the result.
  let fn = !/\W/.test(str) ?
    cache[str] = cache[str] || tmpl(document.getElementById(str).innerHTML) :

    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    new Function('obj',
      'var p=[],print=function(){p.push.apply(p,arguments);};' +

      // Introduce the data as local variables using with(){}
      'with(obj){p.push(\'' +

      // Convert the template into pure JavaScript
      str
      //.toString()
        .replace(/[\r\t\n]/g, ' ')
        .split('<%').join('\t')
        .replace(/((^|%>)[^\t]*)'/g, '$1\r')
        .replace(/\t=(.*?)%>/g, '\',$1,\'')
        .split('\t').join('\');')
        .split('%>').join('p.push(\'')
        .split('\r').join('\\\'')
      + '\');}return p.join(\'\');')
  // Provide some basic currying to the user
  return data ? fn(data) : fn
}

/* -------------------------- */

/**
 * Convert HTML to DOM Node
 *
 * @param html
 * @returns {ChildNode}
 */
function htmlToNode (html) {

  let div       = document.createElement('div')
  div.innerHTML = html.trim()

  return div.firstChild
}

/**
 * Count letters and words
 *
 * @param formSelector
 * @param fieldsSelector
 * @param containerClass
 */
function countText (formSelector, fieldsSelector, containerClass) {
  const form   = document.querySelector(formSelector)
  const fields = form.querySelectorAll(fieldsSelector)
  if (fields) {
    let count = {
      length: 0,
      letters: 0,
      words: 0,
    }
    fields.forEach((field) => {
      resizeTextarea(field)
      const length = field.value.length
      field.setAttribute('data-length', length)
      count.length += length
      const words = field.value.match(/[a-zA-Zа-яА-Я0-9]*/g).filter(word => word.length > 0)
      count.letters += words.join('').length
      count.words += words.length
    })
    for (const key in count) {
      const container = form.querySelector(containerClass + '_' + key)
      if (container) {
        container.innerHTML = count[key]
      }
    }
  }
}

/**
 * проверка элементов формы на заполненность
 *
 * @param form - element object
 * @returns {boolean}
 */
function isRequiredEmpty (form) {
  let error = 0
  form.querySelectorAll('[required]').forEach(function (element) {

    if (!element.value) {
      error++
      element.toggleClass('error', true)
    } else {
      element.toggleClass('error', false)
    }
  })

  return !!error
}

function stripSlashes (str) {
  str = str.replace(/\\'/g, '\'')
  str = str.replace(/\\"/g, '"')
  str = str.replace(/\\0/g, '\0')
  str = str.replace(/\\\\/g, '\\')
  return str
}

/**
 * Correction of form element indexes.
 * Example 1: [ first[]second[], first[]second[] ] -> [ first[0]second[0], first[1]second[0] ]
 * Example 2: [ first[key]second[], first[key]second[] ] -> [ first[key]second[0], first[key]second[1] ]
 *
 * @param fields
 * @returns {*}
 */
function correctIndexes (fields) {
  let newFields = cloneDeep(fields)
  let length    = newFields.length
  let indexes   = []

  // перебор элементов формы
  for (let i = 0; i < length; i++) {
    // поиск по маске в имени элемента формы
    let matches = newFields[i]['name'].matchAll(/(\w+)\[(.*?)\]/g)
    // новое имя поля
    let name    = ''
    // ключ элемента для которого создается индекс:  <ключ>[<индекс>]
    let key     = ''
    // перебор найденного
    for (const match of matches) {
      // формируется уникальный ключ
      key += match[1]
      // если индекс еще не усттановлен
      if (!indexes[key] && 0 !== indexes[key]) {
        // определяется значение первого индекса для указанного ключа
        indexes[key] = 0
      } else {
        // увеличиваем значение ключа
        indexes[key]++
      }
      let index
      // если индкс/ключ в скобках не указан
      if ('' === match[2]) {
        index = indexes[key]
      } else {
        // если индекс уже определен, то вписываем это значение
        index = match[2]
      }
      // новое имя состоит из имени переменной и созданного индекса
      name += match[1] + '[' + index + ']'

      key += index
    }

    // присваиваем новое имя с указанными индексами
    newFields[i]['name'] = name
  }

  // console.log('-')
  return newFields
}

/**
 * Deep cloning of objects and arrays
 *
 * @param obj
 * @returns {*}
 */
function cloneDeep (obj) {

  if ('object' === typeof obj) {
    if (obj instanceof Array) {
      let length = obj.length
      let newObj = new Array(length)
      for (let i = 0; i < length; i++) {
        newObj[i] = (cloneDeep(obj[i]))
      }
      return newObj
    } else {
      let newObj = {}
      if (obj.prototype) {
        newObj.prototype = obj.prototype
      }
      for (let key in obj) {
        newObj[key] = cloneDeep(obj[key])
      }
      return newObj
    }
  }
  return obj
}

/**
 * Form serializing
 */
Object.defineProperty(Object.prototype, 'serialize', {
  value: function (format) {
    let inputs = this.querySelectorAll('[name]')
    let obj    = {}
    let arr    = []
    let s      = []
    let a      = []
    let out
    let val

    for (let i in inputs) {
      if (inputs.hasOwnProperty(i)) {
        let that = inputs[i]

        val = that.value
        if (undefined !== that.getAttribute('type') && 'checkbox' === that.getAttribute('type')) {
          if (undefined !== that.getAttribute('checked') /*&& null!==that.getAttribute( 'checked' )*/) {
            arr.push({ name: that.getAttribute('name'), value: val })
          } else {
            arr.push({ name: that.getAttribute('name'), value: '' })
          }
        } else {
          if (undefined !== that.getAttribute('multiple')) {
            if (null === val) {
              arr.push({ name: that.getAttribute('name'), value: '' })
            } else {
              arr.push({ name: that.getAttribute('name'), value: val })
            }
          } else {
            arr.push({ name: that.getAttribute('name'), value: val })
          }
        }
      }
    }

    // turn to associative array
    for (let i in arr) {
      if (arr.hasOwnProperty(i)) {
        if (obj[arr[i].name]) {
          // if obj[arr[i].name] is not empty
          if (!obj[arr[i].name].push) {
            obj[arr[i].name] = [obj[arr[i].name]]
          }
          // add value
          obj[arr[i].name].push(arr[i].value || '')
        } else {
          obj[arr[i].name] = arr[i].value || ''
        }
      }
    }

    if ('string' === format || 'attributes' === format) {

      // build query
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          let value = obj[key]
          if (true === Array.isArray(value)) {
            value = value.join(',')
          }
          s.push(key + '=' + value)
          a.push(key + '="' + value + '"')
        }
      }
    }

    // choose output format
    switch (format) {
      case 'string':
        out = encodeURI(s.join('&'))
        break
      case 'attributes':
        out = a.join(' ')
        break
      case 'array':
        out = arr
        break
      default:
        out = obj
    }

    return out
  },
  enumerable: false
})

/**
 * Set or unset class to the element
 * Example:
 * <div class="element"></div>
 * <script>
 * document.querySelector('.element').toggleClass('active',true)
 * </script>
 *
 * It will be:
 * <div class="element element_active"></div>
 */
Object.defineProperty(Object.prototype, 'toggleClass', {
  value: function (className, set) {
    let classesOld = this.classList.value.split(' ')
    classesOld     = classesOld.map((item) => {
      item = item.trim()
      if (className === item) return ''

      return item.replace('_' + className, '')
    })
    let classes    = []
    if (true === set) {
      for (let item of classesOld) {
        if (item) {
          classes.push(item + '_' + className)
        }
      }
      classes.push(className)
    }
    classes = [...classesOld, ...classes].filter((value, index, self) => {
      return self.indexOf(value) === index
    }).join(' ')
    this.setAttribute('class', classes)
  },
  enumerable: false
})

/**
 * Get request.
 *
 * @param options
 * @returns {Promise}
 */
function sendRequest (options) {
  return new Promise(function (resolve, reject) {
    let xhr    = new XMLHttpRequest()
    let params = options.data
    let url    = options.url
    // We'll need to stringify if we've been given an object
    // If we have a string, this is skipped.
    if (params) {
      if (typeof params === 'object') {
        params = Object.keys(params).map(function (key) {
          return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
        }).join('&')
      }
      //params = '?' + params;
    } else {
      params = ''
    }
    if (params) {
      url = options.url + '?' + params
    }
    /*if ( 'POST' !== options.method ) {
    url = options.url + params;
  } else {
    if ( undefined !== options.data.action ) {
      url = options.url + '?action=' + options.data.action;
    }
  }*/
    // if method doesn't set
    if (!options.method) {
      options.method = 'get'
    }

    // convert to uppercase
    options.method = options.method.toUpperCase()

    xhr.open(options.method, url)
    xhr.onload  = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response)
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        })
      }
    }
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      })
    }
    if ('POST' === options.method) {
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    }
    if (options.headers) {
      Object.keys(options.headers).forEach(function (key) {
        xhr.setRequestHeader(key, options.headers[key])
      })
    }

    xhr.send(params)
  })
}

/**
 * Функция установки cookie
 *
 * @param name
 * @param value
 * @param options
 */
function setCookie (name, value, options) {
  options = options || {}

  let expires = options.expires

  if ('number' === typeof expires && expires) {
    let d = new Date()
    d.setTime(d.getTime() + expires * 1000)
    expires = options.expires = d
  }
  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString()
  }

  value = encodeURIComponent(value)

  let updatedCookie = name + '=' + value

  for (let propName in options) {
    if (options.hasOwnProperty(propName)) {
      updatedCookie += '; ' + propName
      let propValue = options[propName]
      if (true !== propValue) {
        updatedCookie += '=' + propValue
      }
    }
  }

  document.cookie = updatedCookie
}

/**
 * Функция добавления данных формы в куку
 *
 * @param name
 * @param form
 * @param options
 */
function formToCookie (name, form, options) {
  let data = form.serialize()
  data     = JSON.stringify(data)
  setCookie(name, data, options)
}

// https://stackoverflow.com/questions/17528749/semaphore-like-queue-in-javascript/17528961#17528961
class Queue {
  constructor (autorun = true, queue = []) {
    this.running = false
    this.autorun = autorun
    this.queue   = queue
  }

  add (cb) {
    this.queue.push((value) => {
      const finished = new Promise((resolve, reject) => {
        const callbackResponse = cb(value)

        if (callbackResponse !== false) {
          resolve(callbackResponse)
        } else {
          reject(callbackResponse)
        }
      })

      finished.then(this.dequeue.bind(this), (() => {}))
    })

    if (this.autorun && !this.running) {
      this.dequeue()
    }

    return this
  }

  dequeue (value) {
    this.running = this.queue.shift()

    if (this.running) {
      this.running(value)
    }

    return this.running
  }

  get next () {
    return this.dequeue
  }
}

/*
 /!**
  * Function, that put the data to template block, and return complete HTML.
  *
  * @param str
  * @param data
  * @returns {Function}
  *!/


 /!**
  * Get request.
  *
  * @param options
  * @returns {Promise<any>}
  *!/


 /!*
 Toggle the sidebar.
  *!/
 function sidebar_toggle (action, selector) {
   // get element
   let element = document.getElementsByClassName('sidebar')[0]
   let current = element.getAttribute('data-selector')

   //
   let active = element.getElementsByClassName('active')
   for (let i in active) {
     if (active.hasOwnProperty(i)) {
       active[i].classList.remove('active')
     }
   }

   if (current === null || current === undefined || current === selector) {

     // toggle element
     if (action === 'hide' || (action === undefined && element.classList.contains('active'))) {
       submit.toggleClass('active',false)
       element.removeAttribute('data-selector', selector)
       return
     } else if (action === 'show' || (action === undefined && !element.classList.contains('active'))) {
       submit.toggleClass('active',true)
     }
   }
   element.setAttribute('data-selector', selector)

 }

 function nav_mobile_toggle (action) {
   var nav_mobile = document.getElementsByClassName('js-nav-mobile-container')[0]
   action == 'show' ? nav_mobile.classList.add('active') : nav_mobile.classList.remove('active')
 }*/
// }

// let Oijq = new Oijq

/**
 * add default properties instead null
 *
 * @param attributes
 * @param defaults
 * @returns {*}
 */
function parseAttributes (attributes, defaults) {
  for (let name in defaults) {
    if (!attributes.hasOwnProperty(name)) {
      attributes[name] = defaults[name]
    }
  }
  return attributes
}

/**
 * Adding content block
 *
 * @param data
 */
function addBlock (data) {
  data         = parseAttributes(data, {
    templateId: '', // id ot HTML template
    element: null, // the element after which the block will be inserted
    data: {}, // template data object
    focusOn: '', // selector of an element that should be focused
    scrollOffset: 0, // Offset relative to element position
    scroll: true, // true if have to scroll to the element
  })
  let template = document.getElementById(data.templateId)

  // if there is no template or element then exit
  if (!template || !data.element) return

  // convert HTML to DOM node
  template = htmlToNode(tmpl(template.innerHTML, data.data))

  // insert new block after the element
  data.element.parentNode.insertBefore(template, data.element.nextSibling)

  // if focusOn is not empty
  if (data.focusOn) {
    // set focus on the pointed element
    data.element.nextElementSibling.querySelector(data.focusOn).focus()
  }

  // if we have to scroll
  if (true === data.scroll) {
    // scroll to new block
    scrollCloseTo(template, data.scrollOffset)
  }
}

/**
 * Reindexing all content blocks
 *
 * @param blocksSelector - selector of block that contains dynamic fields
 */
function indexDynamicFields (blocksSelector) {
  // select all blocks
  let blocks = document.querySelectorAll(blocksSelector)
  // loop blocks
  blocks.forEach((el, index) => {
    // search for dynamic fields in current block
    el.querySelectorAll('[data-name]').forEach((field) => {
      const name = field.getAttribute('data-name')
      // set attributes for current field
      field.setAttribute('id', name + '-' + index)
      field.setAttribute('name', name + '[' + index + ']')
    })
  })
}

/**
 * список состояний элемента
 *
 * @param element
 * @param action
 */
function statesList (element, action) {
  switch (action) {
    case 'hide':
      element.toggleClass('hidden', true)
      break
    case 'show':
      element.toggleClass('hidden', false)
      break
    case 'active':
      element.toggleClass('active', true)
      break
    case 'inactive':
      element.toggleClass('active', false)
      break
    case 'enable':
      element.toggleClass('disabled', false)
      element.removeAttribute('disabled')
      break
    case 'disable':
      element.toggleClass('disabled', true)
      element.setAttribute('disabled', 'disabled')
      break
    case 'wait':
      // режим ожидания - элемент блокируется и на нем появляется прелоудер
      element.toggleClass('disabled', true)
      element.setAttribute('disabled', 'disabled')
      element.toggleClass('preloader', true)
      break
    case 'produce':
      // unblocking
      element.removeAttribute('disabled')
      element.toggleClass('preloader', false)
      // "disabled" moved forward for eleminating an error with unused classes like: "disabled_preloader"
      element.toggleClass('disabled', false)
      break
  }
}

/**
 * Функция установки состояния для указанного элемента
 *
 * @param element
 * @param action
 */
function setState (element, action) {

  if ('string' === typeof element) {
    let elements = document.querySelectorAll(element)
    elements.forEach(function (val, i, element) {
      statesList(element[i], action)
    })
  } else {
    statesList(element, action)
  }
}

/**
 * Adding message to pointed block for some time
 * @param selector - block for messages
 * @param message - message text
 * @param timeout - time of current message living
 * @param container - container of one message
 */
function echo (selector, message, timeout, container) {
  if (!container) {
    container = 'p'
  }
  let parent  = document.querySelector(selector)
  let element = htmlToNode('<' + container + '>' + message + '</' + container + '>')
  parent.appendChild(element)
  if (!timeout) {
    timeout = 5000
  } else {
    timeout *= 1000
  }
  setTimeout(function () {
    element.parentNode.removeChild(element)
  }, timeout)
}
