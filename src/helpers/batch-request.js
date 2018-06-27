import * as BX from './bx-api'
// import {getRandomMiliseconds} from './index'

const apiQueriesInBatchCount = 50

export const sendSpecialBatch = async function (method, requestOptions = {}) {
  const {FILTER, SELECT, FIELDS} = requestOptions
  const res = await BX.callMethod(method, requestOptions)
  const total = res.answer.total
  if (res.answer.result.length <= 50 || total <= 50) return res.answer.result

  let items = []
  let lastId = '0'
  let itemsInBatch = 50 * apiQueriesInBatchCount
  let apiBatchesCount = Math.floor(total / itemsInBatch)
  let tail = total % itemsInBatch
  let tailBatchesCount = 0
  let lastBatchItemsCount = 0
  tail && apiBatchesCount++
  tailBatchesCount = Math.floor(tail / 50)
  lastBatchItemsCount = tail % 50
  lastBatchItemsCount && tailBatchesCount++

  for (let j = 0; j < apiBatchesCount; j++) {
    let batchParams = {}
    let batchItemsCount = j === apiBatchesCount - 1
      ? tailBatchesCount
      : apiQueriesInBatchCount

    for (let i = 0; i < batchItemsCount; i++) {
      batchParams[`${method}${i}`] = {
        method: method,
        params: {
          'FILTER': Object.assign({}, FILTER, {
            '>ID': i
              ? `$result[${method}${i - 1}][49][ID]`
              : lastId
          }),
          SELECT,
          FIELDS
        }
      }
    }
    await BX.callBatch(batchParams).then(result => {
      for (let item in result) {
        const itemsChunk = result[item].data()
        const err = result[item].error()
        if (err) {
          console.log(err)
          continue
        }
        items = items.concat(itemsChunk)
        lastId = itemsChunk[itemsChunk.length - 1].ID
      }
      return j
    }).catch(console.error)
  }

  return items
}

export const getTasks = async function (filter = []) {
  const res = await BX.callMethod('task.item.list', filter)
  const total = res.answer.total
  if (total <= 50) return res.answer.result
  let tasks = []
  let lastId = '0'
  let tasksInBatch = 50 * apiQueriesInBatchCount
  let apiBatchesCount = Math.floor(total / tasksInBatch)
  let tail = total % tasksInBatch
  let tailBatchesCount = 0
  let lastBatchTasksCount = 0
  tail && apiBatchesCount++
  tailBatchesCount = Math.floor(tail / 50)
  lastBatchTasksCount = tail % 50
  lastBatchTasksCount && tailBatchesCount++

  for (let j = 0; j < apiBatchesCount; j++) {
    let batchParams = {}
    let batchItemsCount = j === apiBatchesCount - 1 ? tailBatchesCount : apiQueriesInBatchCount

    for (let i = 0; i < batchItemsCount; i++) {
      batchParams[`getTasks${i}`] = {
        method: 'task.item.list'
      }
    }
    await BX.callBatch(batchParams)
      .then(result => {
        for (let item in result) {
          const tasksChunk = result[item].data()
          const err = result[item].error()
          if (err) {
            console.log(err)
            continue
          }
          tasks = tasks.concat(tasksChunk)
          lastId = tasksChunk[tasksChunk.length - 1].ID
        }
        return j
      })
      .catch(console.log)
  }
  return tasks
}
