// import * as BX from './bx-api'
import {sendSpecialBatch, getTasks} from './batch-request'

//
/*export async function getInitialData (getTaskOptions = []) {
  const tasks = await sendSpecialBatch('task.item.list', getTaskOptions)
  let groups = []
  let users = []
  let times = []
  groups = sendSpecialBatch('sonet_group.get', {
    ORDER: {
    NAME: 'ASC'
    },
    
    })
  users = sendSpecialBatch('user.get')
  times = await sendSpecialBatch('task.elapseditem.getlist')
  return {
    tasks: await tasks,
    groups: await groups,
    users: await users,
    times: times
  }
}*/

//
export async function getInitialData (getTaskOptions = []) {
  const times = await sendSpecialBatch('task.elapseditem.getlist', getTaskOptions)

  let GroupsOptions = [{ID : 'desc'},{ID:[-1,]}]
  let UsersOptions = [{ID:[]}]
  let TasksOptions = [{ID : 'desc'},{ID:[-1,]}]

  let groups = []
  let users = []
  let tasks = []

times.forEach(time=>{
  TasksOptions[1].ID.push(time.TASK_ID);
  UsersOptions[0].ID.push(time.USER_ID);
});

  users = await sendSpecialBatch('user.get', UsersOptions)
  tasks = await sendSpecialBatch('task.item.list', TasksOptions)

  tasks.forEach(task=>{
    GroupsOptions[1].ID.push(task.GROUP_ID);
  });

  groups = await sendSpecialBatch('sonet_group.get', GroupsOptions)
  
  return {
    tasks: await tasks,
    groups: await groups,
    users: await users,
    times: await times
  }
}


//
export function getTableData (initialData, data = {}) {
  const {tasks, groups, users, times} = initialData;

  const {domain} = data;
  let ManagedTasks = {}
  let parsedTasks=[];
  tasks.forEach(function(task){
    let tmp = {
      timeStart: Number(getSecondsFromStartOfDay(Date.parse(task.START_DATE_PLAN))),
      timeEnd: Number(getSecondsFromStartOfDay(Date.parse(task.END_DATE_PLAN))),
      status: getStatusName(task.REAL_STATUS),
      title: `<a target="_blank" class="c-link" href="//${domain}/company/personal/user/0/tasks/task/view/${task.ID}/">${task.TITLE}</a>`,
      creator: task.CREATED_BY_LAST_NAME+" "+task.CREATED_BY_NAME,
      project: getProjectName(groups, task.GROUP_ID),
      responded: task.RESPONSIBLE_LAST_NAME+" "+task.RESPONSIBLE_NAME,
      deadline: Number(getSecondsFromStartOfDay(Date.parse(task.DEADLINE))),
    };
    ManagedTasks[task.ID] = tmp;

  });
  times.forEach(function(time){
       let tmp = Object.assign({},
        ManagedTasks[time.TASK_ID], {
          worker: getUserName(users, time.USER_ID),
          date_of_work: Number(getSecondsFromStartOfDay(Date.parse(time.DATE_START))),
          time_of_work: Number(time.SECONDS),
          month: Number(get_month(Number(getSecondsFromStartOfDay(Date.parse(time.DATE_START)))))
            }
      );
      
      parsedTasks.push(tmp);
  });
  console.log(parsedTasks);
  return parsedTasks;
}


//
export function getTimeFromSeconds (seconds) {
seconds = Number(seconds)
var date = new Date(null);
date.setSeconds(seconds);
return date.toISOString().substr(11, 8);
}

//
export function get_YMD_Date (seconds) {
seconds = Number(seconds)
var date = new Date(seconds);
return date.toISOString().substr(0, 4)+'.'+date.toISOString().substr(5, 2)+'.'+date.toISOString().substr(8, 2);
}

//
export function getUserName (arr, id) {
  let ctch = false;
  arr.forEach(function(el){
    if(Number(el.ID) == Number(id)){
      ctch = el.NAME +' '+el.LAST_NAME;
    }
  });
  if(ctch)
    return ctch
  return "Неизвестный"
  
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
export function getStatusName (code) {
switch(code){
  case '1':
  return "Новая";
  break;

  case '2':
  return "Ожидает (Принята)";
  break;

  case '3':
  return "Выполняется";
  break;

  case '4':
  return "Почти завершена";
  break;

  case '5':
  return "Завершена";
  break;

  case '6':
  return "Отложена";
  break;

  case '7':
  return "Отклонена";
  break;

  default:
  return "Без статуса";
}
  
}

//
export function getDateValues () {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const nextMonth = month < 11 ? month + 1 : 0
  return {
    min: new Date(year, month),
    max: new Date(year, month)
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

export var  months_names = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];


// добавление месяца как поля
export function get_month (seconds) {
  return (new Date(seconds)).getMonth();
}
