const { GetHostInfoByHost } = require('./apis')

function formatCache(caches) {
  return caches.map((cache) => [cache.type, cache.rule, cache.time])
}

function formatRefer(refer) {
  return refer ? [refer.type, refer.list, refer.empty] : []
}

async function getCdnByHost(apig, host) {
  const res = await GetHostInfoByHost({
    apig,
    ...{
      hosts: [host]
    }
  })

  if (res && res.hosts.length) {
    return res.hosts[0]
  }
  return undefined
}

async function waitForNotStatus(apig, host, resolve1 = null, reject1 = null) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve = resolve1 || resolve
      reject = reject1 || reject
      const { id, status } = await getCdnByHost(apig, host)
      // 4: deploying, 1: created
      if (status !== 4 && status !== 1) {
        resolve(id)
      } else {
        return waitForNotStatus(apig, host, resolve, reject)
      }
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = {
  formatCache,
  formatRefer,
  getCdnByHost,
  waitForNotStatus
}
