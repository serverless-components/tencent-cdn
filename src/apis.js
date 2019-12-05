function HttpError(code, message) {
  this.code = code || 0
  this.message = message || ''
}

HttpError.prototype = Error.prototype

function apiFactory(actions) {
  const apis = {}
  actions.forEach((action) => {
    apis[action] = ({ apig, ...inputs }) => {
      return new Promise((resolve, reject) => {
        apig.request(
          {
            Action: action,
            RequestClient: 'ServerlessComponent',
            Token: apig.defaults.Token || null,
            ...inputs
          },
          function(err, data) {
            if (err) {
              return reject(err)
            } else if (data.code !== 0) {
              return reject(new HttpError(data.code, data.message))
            }
            resolve(data.data)
          }
        )
      })
    }
  })

  return apis
}

const ACTIONS = [
  'AddCdnHost',
  'SetHttpsInfo',
  'GetHostInfoByHost',
  'DeleteCdnHost',
  'OfflineHost',
  'UpdateCdnConfig'
]
const APIS = apiFactory(ACTIONS)

module.exports = APIS
