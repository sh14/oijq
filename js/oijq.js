'use strict'

/**
 * Correction of form element indexes.
 * Example 1: [ first[]second[], first[]second[] ] -> [ first[0]second[0], first[1]second[0] ]
 * Example 2: [ first[key]second[], first[key]second[] ] -> [ first[key]second[0], first[key]second[1] ]
 *
 * @param fields
 * @returns {any[]|*}
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
 * @returns {any[]|*}
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
 * @returns {Promise<any>}
 */
function request (options) {
  return new Promise(function (resolve, reject) {
    let xhr    = new XMLHttpRequest()
    let params = options.data
    let url    = options.url
    // We'll need to stringify if we've been given an object
    // If we have a string, this is skipped.
    if (params ) {
      if(typeof params === 'object') {
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
    if(!options.method){
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

// class Oijq {
//   constructor (selector) {
//     this.selector = selector
//   }
//
//   on (events, listener) {
//     events = events.split(' ')
//     //console.log( e );
//     for (let i = 0, count = events.length; i < count; i++) {
//       document.addEventListener(events[i], function (event) {
//           if (event.target) {
//             let element = event.target
//             // if the event happened
//             if (null !== element.closest(this.selector)) {
//               // pass data to function
//               listener(event, element, this.selector)
//             }
//           }
//         }
//       )
//     }
//   }

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

/* function getAction (element, action) {
   switch (action) {
     case 'hide':
       element.classList.add('hidden')
       break
     case 'show':
       element.classList.remove('hidden')
       break
     case 'active':
       element.classList.add('active')
       break
     case 'deactive':
       element.classList.remove('active')
       break
   }
 }

 function doAction (element, action) {

   if ('string' === typeof element) {
     let elements = document.querySelectorAll(element)
     elements.forEach(function (val, i, element) {
       getAction(element[i], action)
     })
   } else {
     getAction(element, action)
   }
 }
// Serialize form to an object including empty fields.

 /!**
  * Function, that put the data to template block, and return complete HTML.
  *
  * @param str
  * @param data
  * @returns {Function}
  *!/
 function tmpl (str, data) {
   // Figure out if we're getting a template, or if we need to
   // load the template - and be sure to cache the result.
   let fn = !/\W/.test(str) ?
     cache[str] = cache[str] ||
       tmpl(document.getElementById(str).innerHTML) :

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

 /!**
  * Get request.
  *
  * @param options
  * @returns {Promise<any>}
  *!/
 function get_contents (options) {
   return new Promise(function (resolve, reject) {
     let xhr    = new XMLHttpRequest()
     let params = options.data
     let url    = options.url
     // We'll need to stringify if we've been given an object
     // If we have a string, this is skipped.
     if (params && typeof params === 'object') {
       params = Object.keys(params).map(function (key) {
         return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
       }).join('&')
       //params = '?' + params;
     } else {
       params = ''
     }
     if (params) {
       url = options.url + '?' + params
     }
     /!*if ( 'POST' !== options.method ) {
       url = options.url + params;
     } else {
       if ( undefined !== options.data.action ) {
         url = options.url + '?action=' + options.data.action;
       }
     }*!/
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
