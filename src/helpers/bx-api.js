export const callMethod = (methodName, params) => {
  return new window.Promise((res, rej) => {
    window.BX24.callMethod(
      methodName,
      params,
      result => {
        if (result.error()) {
          rej(result.error())
        } else {
          res(result)
        }
      }
    )
  })
}

export const callBatch = params => {
  return new window.Promise((res, rej) => {
    window.BX24.callBatch(
      params,
      result => {
        res(result)
      }
    )
  })
}
