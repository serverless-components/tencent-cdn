const fs = require('fs')
const path = require('path')
const { GetHostInfoByHost } = require('./apis')

function isEmpty(val) {
  return val === undefined || val === null || (typeof val === 'number' && isNaN(val))
}

function cleanEmptyValue(obj) {
  const newObj = {}
  for (const key in obj) {
    const val = obj[key]
    if (!isEmpty(val)) {
      newObj[key] = val
    }
  }
  return newObj
}

function formatCache(caches) {
  return caches.map((cache) => [cache.type, cache.rule, cache.time])
}

function formatRefer(refer) {
  return refer ? [refer.type, refer.list, refer.empty] : []
}

async function getPathContent(target) {
  let content = ''

  try {
    const stat = fs.statSync(target)
    if (stat.isFile()) {
      if (path.isAbsolute(target)) {
        content = fs.readFileSync(target, 'base64')
      } else {
        content = fs.readFileSync(path.join(process.cwd(), target), 'base64')
      }
    }
  } catch (e) {
    // target is string just return
    content = target
  }
  return content
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
  isEmpty,
  cleanEmptyValue,
  formatCache,
  formatRefer,
  getCdnByHost,
  waitForNotStatus,
  getPathContent
}
