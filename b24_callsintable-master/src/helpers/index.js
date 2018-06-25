// import * as BX from './bx-api'
import {sendSpecialBatch, getCalls} from './batch-request'

//
export async function getInitialData (dateValues, getCallOptions = {}) {
  Object.assign(getCallOptions, {'>CALL_START_DATE': dateValues.min, '<CALL_START_DATE': dateValues.max})
  const calls = await getCalls(getCallOptions)
  let users = []
  let lead = []
  let company = []
  let contact = []
  // собираем все айдишники и делаем их уникальными с помощью сет
  let ids = {
    user: [],
    lead: [],
    company: [],
    contact: []
  }
  calls.forEach(call => {
    call.PORTAL_USER_ID && ids.user.push(call.PORTAL_USER_ID)
    if (call.CRM_ENTITY_ID) {
      ids[call.CRM_ENTITY_TYPE.toLowerCase()].push(call.CRM_ENTITY_ID)
    }
  })
  ids.user = [...new Set(ids.user)]
  ids.lead = [...new Set(ids.lead)]
  ids.company = [...new Set(ids.company)]
  ids.contact = [...new Set(ids.contact)]
  users = sendSpecialBatch('sonet_group.get', {
    ORDER: {
    NAME: 'ASC'
    },
    
    })
    console.log(users)
  if (ids.lead.length) lead = sendSpecialBatch('crm.lead.list')
  if (ids.company.length) company = sendSpecialBatch('crm.company.list', {FILTER: {ID: ids.company}})
  if (ids.contact.length) contact = sendSpecialBatch('crm.contact.list', {FILTER: {ID: ids.contact}})
  return {
    calls: calls,
    users: await users,
    lead: await lead,
    company: await company,
    contact: await contact
  }
}

export function getTableData (initialData, data = {}) {
  const {calls, users} = initialData
  console.log(users)
  const {domain} = data
  const parsedCalls = calls.map(call => {
    Object.assign(call, {
      type: getCallType(call.CALL_TYPE),
      timeStart: getSecondsFromStartOfDay(Date.parse(call.START_DATE_PLAN)),
      timeEnd: getSecondsFromStartOfDay(Date.parse(call.END_DATE_PLAN)),
      cost: +call.COST,
      status: call.REAL_STATUS,
      title: call.TITLE,
      creator: call.CREATED_BY_LAST_NAME+" "+call.CREATED_BY_NAME,
      project: getProjectName(users, call.GROUP_ID),
      responded: call.RESPONSIBLE_LAST_NAME+" "+call.RESPONSIBLE_NAME,
      deadline: call.DEADLINE,
      activityLink: getActivityLink(+call.CRM_ACTIVITY_ID, domain),
      entityLink: 'Нет',
      entityTypeOrigin: call.CRM_ENTITY_TYPE ? call.CRM_ENTITY_TYPE.toLowerCase() : '',
      entityType: getEntityType(call.CRM_ENTITY_TYPE)
    })
    /*users && users.forEach(user => {
      user.name = `${user.LAST_NAME ? user.LAST_NAME : ''} ${user.NAME ? user.NAME : ''}`.trim()
      if (+user.ID === +call.PORTAL_USER_ID) {
        if (domain) {
          call.callerName = `<a target="_blank" class="c-link" href="//${domain}/company/personal/user/${user.ID}/">${user.name}</a>`
        } else {
          call.callerName = user.name
        }
      }
    })*/
    initialData[call.entityTypeOrigin] && initialData[call.entityTypeOrigin].forEach(item => {
      if (+item.ID === +call.CRM_ENTITY_ID) {
        let ttl = item.TITLE
        if (typeof ttl === 'undefined') ttl = `${item.LAST_NAME ? item.LAST_NAME : ''} ${item.NAME ? item.NAME : ''}`.trim()
        if (domain) {
          call.entityLink = `<a target="_blank" class="c-link" href="//${domain}/crm/${call.entityTypeOrigin}/details/${call.CRM_ENTITY_ID}/">${ttl}</a>`
        } else {
          call.entityLink = ttl
        }
      }
    })
    return call
  })
  return parsedCalls
}
//
export function getProjectName (arr, id) {
  arr.forEach(function(group){
    console.log(group.ID + "........." + id);
    if(group.ID==id)
      return group.NAME;
  });
  return "Без проекта"
}

//
export function getDateValues () {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const nextMonth = month < 11 ? month + 1 : 0
  return {
    min: new Date(year, month),
    max: new Date(new Date(year, nextMonth) - 1)
  }
}

//
export function getCopyOfObj (obj) {
  return JSON.parse(JSON.stringify(obj))
}

// дата в милисекундах
export function getFormattedDate (date = Date.now(), options) {
  if (!options) {
    options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timezone: 'UTC'
    }
  }

  return date.toLocaleString('ru', options)
}

export function getFormattedTime (date, options) {
  if (!options) {
    options = {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  }
  return date.toLocaleTimeString('ru')
}

export function getFormattedTimeFromSeconds (seconds) {
  // ~~ сокращенное Math.floor
  // http://rocha.la/JavaScript-bitwise-operators-in-practice
  let date = new Date(seconds)
  let year = date.getFullYear()
  let month = date.getMonth()
  let day = date.getDate()
  let hrs = date.getHours()
  let mins = date.getMinutes()
  let secs = date.getSeconds()
  //возвращаемый формат. например "1:01", "4:03:59", "123:03:59"
  let ret = ''
  ret += '' + year + '.' + (month < 10 ? '0' : '')
  ret += '' + month + '.' + (day < 10 ? '0' : '')
  ret += '' + day + '|'
  ret += '' + hrs + ':' + (mins < 10 ? '0' : '')
  ret += '' + mins + ':' + (secs < 10 ? '0' : '')
  ret += '' + secs
  return ret
}

export function getDomain () {
  let domain = ''
  try {
    domain = window.BX24.getAuth().domain
  } catch (e) {
    console.error(e)
  }
  return domain
}

export function getDomainWithTimer () {
  let i = 1
  let domain = ''
  return new Promise((resolve, reject) => {
    const timerId = setTimeout(function go () {
      domain = getDomain()
      if (domain) {
        clearTimeout(timerId)
        resolve(domain)
      } else if (i < 10) {
        setTimeout(go, 500)
      } else {
        resolve(domain)
      }
      i++
    }, 500)
  })
}

export function getDateWithShiftedDay (date, shift = 0) {
  date = new Date(date)
  const year = date.getUTCFullYear()
  const month = date.getMonth()
  const dateInMonth = date.getDate() + shift
  return new Date(year, month, dateInMonth)
}

export function getSecondsFromStartOfDay (date) {
  date = new Date(date)
  return date.getTime()
}

export function extractContent (html) {
  const span = document.createElement('span')
  span.innerHTML = html
  return span.textContent || span.innerText
}

export function getRawPhone (phoneStr) {
  return phoneStr.replace(/\D+/g, '')
}

export function getCallType (code) {
  code = String(code)
  let result = ''
  switch (code) {
    case '1':
      result = 'Исходящий'
      break
    case '2':
      result = 'Входящий'
      break
    case '3':
      result = 'Входящий с перенаправлением'
      break
    case '4':
      result = 'Обратный'
      break
    default:
      result = 'Не определен'
  }
  return result
}

export function getCallStatus (code) {
  code = String(code)
  let result = ''
  switch (code) {
    case '200':
      result = 'Успешный'
      break
    case '304':
      result = 'Пропущенный'
      break
    case '603':
      result = 'Отклонено'
      break
    case '603-S':
      result = 'Вызов отменен'
      break
    case '403':
      result = 'Запрещено'
      break
    case '404':
      result = 'Неверный номер'
      break
    case '486':
      result = 'Занято'
      break
    case '484':
    case '503':
      result = 'Данное направление не доступно'
      break
    case '480':
      result = 'Временно не доступен'
      break
    case '402':
      result = 'Недостаточно средств на счету'
      break
    case '423':
      result = 'Заблокировано'
      break
    default:
      result = 'Не определён'
      break
  }
  return result
}

export function getEntityType (type) {
  let entityType = 'Неизвестно'
  if (type === 'CONTACT') entityType = 'Контакт'
  else if (type === 'COMPANY') entityType = 'Компания'
  else if (type === 'LEAD') entityType = 'Лид'
  return entityType
}

export function getActivityLink (id, domain) {
  if (domain) {
    return id === 0 ? 'Нет' : `<a target="_blank" class="c-link" href="//${domain}/crm/activity/?open_view=${id}">Перейти к делу</a>`
  } else {
    return 'Ошибка'
  }
}

// a and b are js date objects
const _msPerDay = 1000 * 60 * 60 * 24
export function getDateDiffInDays (a, b) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.floor((utcB - utcA) / _msPerDay)
}
