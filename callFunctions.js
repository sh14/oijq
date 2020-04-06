
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
  if (!isRequiredOk(form)) {
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

      setUrl({ title: 'Сохранено', html: '' }, '?id=' + result.post_id)

      setPageStatus(false)
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
          addBlock(null, {
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
  setPageStatus(true)
})

on('change', '[data-name="i"]', function (event) {
  if (isUrl(event.target.value)) {
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
