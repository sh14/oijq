'use strict'
let form_changed = false

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

  // 2 пикселя верхнего и нижнего бордеров, чтоб избавиться от скрола
  let gitter = 2

  if ('textarea' !== textarea.tagName.toLowerCase()) {
    return false
  }

  /*
    gitter = parseInt(window.getComputedStyle(textarea, null).getPropertyValue('padding-top')) +
      parseInt(window.getComputedStyle(textarea, null).getPropertyValue('padding-bottom'))
  */

  textarea.style.height = 'auto'
  textarea.style.height = (textarea.scrollHeight + gitter) + 'px'
}

function confirmExit () {
  // если форма изменилась
  if (true === form_changed) {
    return 'You have attempted to leave this page. Are you sure?'
  }
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
function is_url (str) {
  let pattern = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
  return pattern.test(str)
}

/**
 * Set page URL
 *
 * @param data
 * @param url
 */
function set_page_url (data, url) {
  document.title = data.title
  window.history.pushState({ 'html': data.html, 'pageTitle': data.title }, '', url)
}

/**
 * Scroll to a given element
 *
 * @param el
 */
function scrollTo (el) {
  let y = el.offsetTop + el.offsetHeight
  window.scrollTo(0, y)
}

/**
 * Add event listner
 *
 * @param e
 * @param selector
 * @param func
 */
function on (e, selector, func) {
  e = e.split(' ')
  // cl( e );
  for (let i = 0, count = e.length; i < count; i++) {
    document.addEventListener(e[i], function (event) {
      let element = event.target
      // if the element or the closest one was involved
      if (element.closest(selector)) {
        // pass variables to function
        func(event, selector)
      }
    })
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

function change_post_status (status) {
  form_changed                                        = status
  document.querySelector('.js-post-status').innerHTML = status ? '☒︎' : ''
}

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
 * Count number of letters in given element
 *
 * @param event
 */
function countText (event) {
  if (undefined !== event) {
    // изменение размера редактируемого блока
    resizeTextarea(event.target)
  }
  let forms = document.querySelectorAll('.js-count-text')
  Array.prototype.slice.call(forms)
  forms.forEach(function (form) {
    let count  = {
      length: 0,
      letters: 0,
      words: 0,
    }
    let blocks = form.querySelectorAll('.js-count-text-block')

    blocks.forEach(function (block) {

      if (undefined === event) {
        // изменение размера текущего перебираемого блока
        resizeTextarea(block)
      }

      count.length += block.value.length
      let words = block.value.match(/[a-zA-Zа-яА-Я0-9]*/g).filter(word => word.length > 0)
      // cl( words );
      count.letters += words.join('').length
      count.words += words.length
    })

    let words_class = count.words >= 300 ? 'success' : 'warning'
    form.setAttribute('data-count-text', count.letters)
    form.querySelector('.js-count-text-output').innerHTML =
      'S: ' + count.length +
      ', ' +
      'L: ' + count.letters +
      ', ' +
      'W: <span class="form__text-' + words_class + '">' + count.words + '</span>'
  })
}

/**
 * проверка элементов формы на заполненность
 *
 * @param form - element object
 * @returns {boolean}
 */
function is_requiredOk (form) {
  let error = true
  form.querySelectorAll('[required]').forEach(function (element) {

    if ('' === element.value) {
      error = false
      element.classList.add('error-required')
    }
  })
  return error
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
 * Get request.
 *
 * @param options
 * @returns {Promise}
 */
function request (options) {
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
          statusText: xhr.statusText
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
/*  let Queue = (function () {

    function Queue () {
    }

    Queue.prototype.running = false

    Queue.prototype.queue = []

    Queue.prototype.add_function = function (callback) {
      let _this = this
      //add callback to the queue
      this.queue.push(function () {
        let finished = callback()
        if (typeof finished === 'undefined' || finished) {
          //  if callback returns `false`, then you have to
          //  call `next` somewhere in the callback
          _this.next()
        }
      })

      if (!this.running) {
        // if nothing is running, then start the engines!
        this.next()
      }

      return this // for chaining fun!
    }

    Queue.prototype.next = function () {
      this.running = false
      //get the first element off the queue
      let shift    = this.queue.shift()
      if (shift) {
        this.running = true
        shift()
      }
    }

    return Queue

  })()*/

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
       element.classList.remove('active')
       element.removeAttribute('data-selector', selector)
       return
     } else if (action === 'show' || (action === undefined && !element.classList.contains('active'))) {
       element.classList.add('active')
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
 * Добавление интервью-блока
 *
 * @param after
 * @param data
 */
function add_interview_block (atts) {
  atts = parseAttributes(atts, {
    data: {},
    templateId: null,
    fields: [],
    after: null,
    formSelector: null,
  })

  if (!atts.templateId) return

  let template = document.getElementById(templateId).innerHTML
  template     = htmlToNode(tmpl(template, atts.data))
  if (!template) return

  if (atts.fields) {
    for (const name of atts.fields) {
      template.querySelectorAll('[data-name="' + name + '"]').forEach(() => {
        this.value = atts.data[name] || ''
      })
    }
  }

  // если элемент не указан
  if (!atts.after) {
    if (!atts.formSelector) return
    // get form element
    atts.after = document.querySelector(atts.formSelector)
    // append template
    atts.after.appendChild(template)
  } else {

    // add template after an element
    atts.after.parentNode.insertBefore(template, atts.after.nextSibling)
  }

  scrollTo(template)
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
      element.classList.add('hidden-block')
      break
    case 'show':
      element.classList.remove('hidden-block')
      break
    case 'active':
      element.classList.add('active')
      break
    case 'deactive':
      element.classList.remove('active')
      break
    case 'enable':
      element.classList.remove('disabled')
      element.removeAttribute('disabled')
      break
    case 'disable':
      element.classList.add('disabled')
      element.setAttribute('disabled', 'disabled')
      break
    case 'wait':
      // режим ожидания - элемент блокируется и на нем появляется прелоудер
      element.classList.add('disabled')
      element.setAttribute('disabled', 'disabled')
      element.classList.add('preloader')
      break
    case 'unwait':
      // разблокировка
      element.classList.remove('disabled')
      element.removeAttribute('disabled')
      element.classList.remove('preloader')
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

on('change', '[required]', function (event) {
  let element = event.target
  if ('' !== element.value) {
    element.classList.remove('error-required')
  }
})
on('submit', '.js-interview-form', function (event) {
  event.preventDefault()

  let form    = event.target
  let submits = form.querySelectorAll('[type="submit"]')
  if (!is_requiredOk(form)) {
    submits.forEach(function (submit) {
      submit.classList.add('button_error')
    })

    add_form_message('Необходимо заполнить все поля, помеченные красным цветом', 30)
    setTimeout(function () {
      submits.forEach(function (submit) {
        submit.classList.remove('button_error')
      })
    }, 300)

    return
  }

  submits.forEach(function (submit) {
    submit.classList.remove('button_error')
    setState(submit, 'wait')
  })

  rename_interview_inputs(form)

  let data = form.serializeObject()
  //data.action = 'oipublisher_save_interview';
  // cl( data );
  get_contents({
    method: 'POST',
    url: oipublisher.ajax_url,
    data: data,
  }).then(function (result) {
    result = JSON.parse(result)

    //cl( result );

    if (true === result.success) {

      result = result.data

      set_page_url({ title: 'Сохранено', html: '' }, '?id=' + result.post_id)

      change_post_status(false)
      form.querySelector('[name=post_thumb]').value       = result.post_thumb
      form.querySelector('[name=post_thumb_index]').value = result.post_thumb_index

      // коррекция данных в обычных полях формы
      let names = ['post_id', 'tags', 'post_title', 'subtitle', 'content', 'hash_link', 'oiinstagramgallery_account']
      names.forEach(function (name) {
        let control = form.querySelector('.js-form-control-' + name)
        if (undefined !== control && null !== control) {
          control.value = result[name]
        }
      })

      names = ['post_title', 'subtitle', 'content',]
      names.forEach(function (name) {
        let control = form.querySelector('.js-form-control-' + name)
        if (undefined !== control && null !== control) {
          control.value = result[name] ? stripSlashes(result[name]) : ''
        }
      })

      // обновление ссылки предпросмотра
      form.querySelector('.js-preview-link').setAttribute('href', result.hash_link)

      // если текстовые блоки существуют
      if (undefined !== result.q && result.q.length > 0) {
        result.q.forEach(function (value, i) {
          form.querySelector('[name="q[' + i + ']"]').value = result.q[i] ? stripSlashes(result.q[i]) : ''
          if (undefined !== result.a && result.a.length > 0) {
            form.querySelector('[name="a[' + i + ']"]').value = result.a[i]
          }
          form.querySelector('[name="i[' + i + ']"]').value     = result.i[i]
          form.querySelector('[name="index[' + i + ']"]').value = result.index[i]
        })
      }

      add_form_message('Публикация сохранена')
      setState(form.querySelector('.js-copy-box'), 'show')
      let element = form.querySelector('.js-thumbnail')
      if (undefined !== element && null !== element) {
        setState(element, 'show')
      }

      countText()
    } else {

      if (undefined !== result.data.errors) {
        for (let i in result.data.errors) {
          if (result.data.errors.hasOwnProperty(i)) {
            add_form_message(result.data.errors[i])
          }
        }
      } else {
        add_form_message('При сохранении возникла ошибка')
      }

      cl(result)
    }
    submits.forEach(function (submit) {
      setState(submit, 'unwait')
    })
  }).catch(function (err) {
    if (err.hasOwnProperty('statusText')) {
      add_form_message('При сохранении возникла ошибка, проверьте правильность заполнения всех полей и повторите попытку', 30)
      console.error('There was an error!', err.statusText)
    } else {
      console.error(err)
    }
  })

})

// подтверждение того, что средства были переведены на счет пользователя
on('click', '.js-transaction-list__accept', function (event) {
  event.preventDefault()

  let confirm = event.target
  let data    = {
    'action': 'oipublisher_balance_decrease',
    'balance_id': confirm.getAttribute('data-balance_id'),
    'user_id': confirm.getAttribute('data-user_id'),
    'amount': confirm.getAttribute('data-amount'),
  }
  setState(confirm, 'wait')

  get_contents({
    method: 'GET',
    url: oipublisher.ajax_url,
    data: data,
  }).then(function (result) {
    let data = JSON.parse(result)
    // cl( data );
    if (true === data.success) {
      let item = confirm.closest('[data-type="request"]')
      item.parentNode.removeChild(item)
    } else {
      setState(confirm, 'unwait')
    }
  }).catch(function (err) {
    if (err.hasOwnProperty('statusText')) {
      add_form_message('Возникла ошибка.', 30)
      console.error('There was an error!', err.statusText)
    } else {
      console.error(err)
    }

    setState(confirm, 'unwait')
  })
})

// удаление запроса на вывод
on('click', '.js-transaction-list__remove', function (event) {
  event.preventDefault()

  let confirm = event.target
  let data    = {
    'action': 'oipublisher_remove_balance_request',
    'balance_id': confirm.getAttribute('data-balance_id'),
    'user_id': confirm.getAttribute('data-user_id'),
  }
  setState(confirm, 'wait')

  get_contents({
    method: 'POST',
    url: oipublisher.ajax_url,
    data: data,
  }).then(function (result) {
    let data = JSON.parse(result)
    // cl( data );
    if (true === data.success) {
      let item = confirm.closest('[data-type="request"]')
      item.parentNode.removeChild(item)
      setState(document.querySelector('.js-balance_request_form'), 'show')

    } else {
      setState(confirm, 'unwait')
    }
  }).catch(function (err) {
    if (err.hasOwnProperty('statusText')) {
      add_form_message('Возникла ошибка.', 30)
      console.error('There was an error!', err.statusText)
    } else {
      console.error(err)
    }

    setState(confirm, 'unwait')
  })
})

// получение контента статьи
on('click', '.js-get_article_from_content', function (event) {
  event.preventDefault()

  let confirm = event.target
  let data    = {
    'action': 'oipublisher_get_article_from_content',
    'post_id': confirm.getAttribute('data-post_id'),
  }
  // cl( data );
  setState(confirm, 'wait')

  get_contents({
    method: 'POST',
    url: oipublisher.ajax_url,
    data: data,
  }).then(function (result) {
    let data = JSON.parse(result)
    // cl( data );
    if (true === data.success) {
      data = data.data
      for (let i in data.q) {
        if (data.q.hasOwnProperty(i)) {
          add_interview_block(null, {
            t: data.t[i] || 'p',
            q: data.q[i] || '',
          })
        }
      }

    }
    setState(confirm, 'unwait')
    countText()
  }).catch(function (err) {
    if (err.hasOwnProperty('statusText')) {
      add_form_message('Возникла ошибка.', 30)
      console.error('There was an error!', err.statusText)
    } else {
      console.error(err)
    }

    setState(confirm, 'unwait')
  })
})

on('change', '#interview_form [name]', function () {
  change_post_status(true)
})

on('change', '[data-name="i"]', function (event) {
  if (is_url(event.target.value)) {
    // cl( 'ok' );
  } else {
    // cl( 'not ok' );
  }
})

on('click', '.js-transaction-button', function (event) {
  event.preventDefault()

  let type  = event.target.getAttribute('data-type')
  let items = document.querySelectorAll('.js-transaction-list li')
  document.querySelectorAll('.js-transaction-button').forEach(function (el) {
    el.classList.remove('active')
  })
  event.target.classList.add('active')
  for (let i in items) {
    if (items.hasOwnProperty(i)) {
      // cl( type + ' - ' + items[ i ].getAttribute( 'data-type' ) );
      if (type === '') {
        items[i].classList.remove('hidden-block')
      } else {
        if (type === items[i].getAttribute('data-type')) {
          items[i].classList.remove('hidden-block')
        } else {
          items[i].classList.add('hidden-block')
        }
      }
    }
  }
})

on('click', '.js-submit-interview-request', function (event) {
  event.preventDefault()

  // установка куки на неделю
  formToCookie('preregister_user_data', event.target.closest('form'), {
    'expires': 7 * 24 * 3600,
    'Path': '/',
  })

  setState(document.querySelector('.js-interview-request-form'), 'hide')
  setState(document.querySelector('.js-registration-form'), 'show')
})

on('click', '.js-copy-link', function (event) {
  event.preventDefault()

  event.target.closest('.js-copy-box').querySelector('.js-copy-text').select()
  document.execCommand('copy')
  add_form_message('Ссылка скопирована.', 10)
})

// пересчет символов
on('keyup', '.js-count-text-block', countText)
countText()

window.onbeforeunload = confirmExit
