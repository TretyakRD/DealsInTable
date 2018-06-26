// import * as BX from './bx-api'
import {sendSpecialBatch, getTasks} from './batch-request'

//
export async function getInitialData (dateValues, getTaskOptions = []) {
  const tasks = await getTasks(getTaskOptions)
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
  tasks.forEach(task => {
    task.PORTAL_USER_ID && ids.user.push(task.PORTAL_USER_ID)
    if (task.CRM_ENTITY_ID) {
      ids[task.CRM_ENTITY_TYPE.toLowerCase()].push(task.CRM_ENTITY_ID)
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
  if (ids.lead.length) lead = sendSpecialBatch('crm.lead.list')
  if (ids.company.length) company = sendSpecialBatch('crm.company.list', {FILTER: {ID: ids.company}})
  if (ids.contact.length) contact = sendSpecialBatch('crm.contact.list', {FILTER: {ID: ids.contact}})
  return {
    tasks: await tasks,
    users: await users,
    lead: await lead,
    company: await company,
    contact: await contact
  }
}

//
export function getTableData (initialData, data = {}) {
  const {tasks, users} = initialData;
  const {domain} = data;
  const parsedTasks = tasks.map(task => {
    let tmp = Object.assign(task, {
      timeStart: getSecondsFromStartOfDay(Date.parse(task.START_DATE_PLAN)),
      timeEnd: getSecondsFromStartOfDay(Date.parse(task.END_DATE_PLAN)),
      status: task.REAL_STATUS,
      title: task.TITLE,
      creator: task.CREATED_BY_LAST_NAME+" "+task.CREATED_BY_NAME,
      project: getProjectName(users, task.GROUP_ID),
      responded: task.RESPONSIBLE_LAST_NAME+" "+task.RESPONSIBLE_NAME,
      deadline: getSecondsFromStartOfDay(Date.parse(task.DEADLINE))
    })
    return tmp
  })
  return parsedTasks;
}

//
export function getProjectName (arr, id) {
  let ctch = false;
  arr.forEach(function(el){
    if(Number(el.ID) == Number(id)){
      ctch = el.NAME
    }
  });
  if(ctch)
    return ctch
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
    if(isNaN(seconds))
    return "Не назначено"
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



// a and b are js date objects
const _msPerDay = 1000 * 60 * 60 * 24
export function getDateDiffInDays (a, b) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.floor((utcB - utcA) / _msPerDay)
}
