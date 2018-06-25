import * as BX from './bx-api'
// import {getRandomMiliseconds} from './index'

const apiQueriesInBatchCount = 50

export const sendSpecialBatch = async function (method, requestOptions = {}) {
  const {FILTER, SELECT, FIELDS} = requestOptions
  const res = await BX.callMethod(method, requestOptions)
  const total = res.answer.total
  if (total <= 50) return res.answer.result
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

export const getCalls = async function (filter = {}) {
  const res = await BX.callMethod('task.item.list')
  console.log(res)
  const total = res.answer.total
  if (total <= 50) return res.answer.result
  let calls = []
  let lastId = '0'
  let callsInBatch = 50 * apiQueriesInBatchCount
  let apiBatchesCount = Math.floor(total / callsInBatch)
  let tail = total % callsInBatch
  let tailBatchesCount = 0
  let lastBatchCallsCount = 0
  tail && apiBatchesCount++
  tailBatchesCount = Math.floor(tail / 50)
  lastBatchCallsCount = tail % 50
  lastBatchCallsCount && tailBatchesCount++

  for (let j = 0; j < apiBatchesCount; j++) {
    let batchParams = {}
    let batchItemsCount = j === apiBatchesCount - 1 ? tailBatchesCount : apiQueriesInBatchCount

    for (let i = 0; i < batchItemsCount; i++) {
      batchParams[`getCalls${i}`] = {
        method: 'task.item.list'
      }
    }
    await BX.callBatch(batchParams)
      .then(result => {
        for (let item in result) {
          const callsChunk = result[item].data()
          const err = result[item].error()
          if (err) {
            console.log(err)
            continue
          }
          calls = calls.concat(callsChunk)
          lastId = callsChunk[callsChunk.length - 1].ID
        }
        return j
      })
      .catch(console.log)
  }
  return calls
}

// для размножения звонков
/* eslint-disable */
const startTimeStamp = Date.parse('2018-04-25T08:00:00.000Z');
const callsCount = 8000;
const httpQueriesBatchCount = 20;
export const populateCalls = async function (){
	let counter = 0;
	try{
		const result = await BX.callMethod('user.get', {});
		const users = result.data();
		for(let j = 0; j < users.length; j++){
			let time = startTimeStamp;
			let user = users[j];
			let loopsCount = Math.floor(callsCount*2/apiQueriesInBatchCount);

			if(callsCount*2 % apiQueriesInBatchCount){
				loopsCount += 1;
			}

			for(let i = 0; i<loopsCount; i++){
				let httpQueriesBatch = [];

				for(let z = 0; z < apiQueriesInBatchCount/2; z++){
					let callDuration = getRandomMiliseconds();
					let date = new Date(time);
					let params = {};

					params[`registerCall${z}`] = {
						method: 'telephony.externalcall.register',
						params:{
							'USER_ID': +user.ID,
							'PHONE_NUMBER': user.WORK_PHONE.trim(),
							'CALL_START_DATE': date.toISOString(),
							'TYPE': 1
						}
					};
					params[`finishCall${z}`] = {
						method: 'telephony.externalcall.finish',
						params:{
							'CALL_ID': `$result[registerCall${z}][CALL_ID]`,
							'USER_ID': user.ID,
							'DURATION': Math.floor(callDuration/1000)
						}
					};
					time += callDuration;
					time += getRandomMiliseconds();
					httpQueriesBatch.push(
						BX.callBatch(params)
						.then(()=>{
						})
						.catch(console.log)
					);
				}

				if(i == 0 || i % httpQueriesBatchCount != 0){
					continue;
				}

				await window.Promise.all(httpQueriesBatch);

				counter += apiQueriesInBatchCount*httpQueriesBatchCount/2;
				httpQueriesBatch = [];
			}
		}
	}catch(e){
		console.log('Caught exception');
		console.log(e);
	}

};

function getRandomMiliseconds(){
	return Math.floor(Math.random()*1000000);
}
