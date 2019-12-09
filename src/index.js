const { Component } = require('@serverless/core')
const Capi = require('qcloudapi-sdk')
const TencentLogin = require('tencent-login')
const _ = require('lodash')
const fs = require('fs')
const { AddCdnHost, SetHttpsInfo, UpdateCdnConfig, OfflineHost, DeleteCdnHost } = require('./apis')
const {
  formatCache,
  formatRefer,
  getCdnByHost,
  waitForNotStatus,
  getPathContent
} = require('./utils')

class TencentCdn extends Component {
  async doLogin() {
    const login = new TencentLogin()
    const tencent_credentials = await login.login()
    if (tencent_credentials) {
      tencent_credentials.timestamp = Date.now() / 1000
      try {
        const tencent = {
          SecretId: tencent_credentials.secret_id,
          SecretKey: tencent_credentials.secret_key,
          AppId: tencent_credentials.appid,
          token: tencent_credentials.token,
          expired: tencent_credentials.expired,
          signature: tencent_credentials.signature,
          uuid: tencent_credentials.uuid,
          timestamp: tencent_credentials.timestamp
        }
        await fs.writeFileSync('./.env_temp', JSON.stringify(tencent))
        return tencent
      } catch (e) {
        throw 'Error getting temporary key: ' + e
      }
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  async getTempKey(temp) {
    const that = this

    if (temp) {
      while (true) {
        try {
          const tencent_credentials_read = JSON.parse(await fs.readFileSync('./.env_temp', 'utf8'))
          if (
            Date.now() / 1000 - tencent_credentials_read.timestamp <= 6000 &&
            tencent_credentials_read.AppId
          ) {
            return tencent_credentials_read
          }
          await that.sleep(1000)
        } catch (e) {
          await that.sleep(1000)
        }
      }
    }

    try {
      const data = await fs.readFileSync('./.env_temp', 'utf8')
      try {
        const tencent = {}
        const tencent_credentials_read = JSON.parse(data)
        if (
          Date.now() / 1000 - tencent_credentials_read.timestamp <= 6000 &&
          tencent_credentials_read.AppId
        ) {
          return tencent_credentials_read
        }
        const login = new TencentLogin()
        const tencent_credentials_flush = await login.flush(
          tencent_credentials_read.uuid,
          tencent_credentials_read.expired,
          tencent_credentials_read.signature,
          tencent_credentials_read.AppId
        )
        if (tencent_credentials_flush) {
          tencent.SecretId = tencent_credentials_flush.secret_id
          tencent.SecretKey = tencent_credentials_flush.secret_key
          tencent.AppId = tencent_credentials_flush.appid
          tencent.token = tencent_credentials_flush.token
          tencent.expired = tencent_credentials_flush.expired
          tencent.signature = tencent_credentials_flush.signature
          tencent.uuid = tencent_credentials_read.uuid
          tencent.timestamp = Date.now() / 1000
          await fs.writeFileSync('./.env_temp', JSON.stringify(tencent))
          return tencent
        }
        return await that.doLogin()
      } catch (e) {
        return await that.doLogin()
      }
    } catch (e) {
      return await that.doLogin()
    }
  }

  async initCredential() {
    // login
    const temp = this.context.instance.state.status
    this.context.instance.state.status = true
    let { tencent } = this.context.credentials
    if (!tencent) {
      tencent = await this.getTempKey(temp)
      this.context.credentials.tencent = tencent
    }
  }

  async default(inputs = {}) {
    await this.initCredential()
    this.context.status('Deploying')

    inputs.projectId = 0
    const params = _.cloneDeep(inputs)
    const {
      host,
      hostType,
      origin,
      backupOrigin = '',
      serviceType = 'web',
      fullUrl = 'off',
      fwdHost,
      cache,
      cacheMode = 'simple',
      refer,
      accessIp,
      https
    } = params

    const apig = new Capi({
      SecretId: this.context.credentials.tencent.SecretId,
      SecretKey: this.context.credentials.tencent.SecretKey,
      serviceType: 'cdn',
      Token: this.context.credentials.tencent.token
    })

    const cdnInputs = {
      host: host,
      projectId: 0,
      hostType: hostType,
      origin: origin,
      backupOrigin: backupOrigin,
      serviceType: serviceType,
      fullUrl: fullUrl,
      fwdHost: fwdHost || host,
      cacheMode: cacheMode
    }

    if (cache) {
      cdnInputs.cache = JSON.stringify(formatCache(cache))
    }
    if (refer) {
      cdnInputs.refer = JSON.stringify(formatRefer(refer[0]))
    }
    if (accessIp) {
      cdnInputs.accessIp = JSON.stringify(accessIp)
    }

    const cdnInfo = await getCdnByHost(apig, host)
    const state = {
      host: host,
      origin: origin
    }
    const outputs = {
      host: host,
      origin: origin,
      cname: `${host}.cdn.dnsv1.com`
    }

    if (cdnInfo) {
      // update
      this.context.debug(`The CDN domain ${host} has existed.`)
      this.context.debug('Updating...')
      cdnInputs.hostId = cdnInfo.id
      await UpdateCdnConfig({ apig, ...cdnInputs })
      state.hostId = cdnInfo.id
      outputs.updated = true
      outputs.hostId = cdnInfo.id
    } else {
      // create
      this.context.debug(`Adding CDN domain ${host}...`)
      try {
        await AddCdnHost({ apig, ...cdnInputs })
      } catch (e) {
        if (e.code === 9111) {
          this.context.debug(`Please goto https://console.cloud.tencent.com/cdn open CDN service.`)
        }
        throw e
      }
      const { id } = await getCdnByHost(apig, host)
      state.hostId = id
      outputs.created = true
      outputs.hostId = id
    }

    // state=4: deploying status, we can not do any operation
    this.context.debug('Waiting for CDN deploy success...')
    await waitForNotStatus(apig, host)
    this.context.debug(`CDN deploy success to host: ${host}`)

    if (https) {
      this.context.debug(`Setup https for ${host}...`)
      // update https
      const httpsInputs = {
        host: host,
        httpsType: https.httpsType,
        forceSwitch: https.forceSwitch,
        http2: https.http2
      }
      // if set certId, it is prefered
      if (https.certId) {
        httpsInputs.certId = https.certId
      } else {
        const certContent = await getPathContent(https.cert)
        const privateKeyContent = await getPathContent(https.privateKey)
        httpsInputs.cert = certContent
        httpsInputs.privateKey = privateKeyContent
      }

      await SetHttpsInfo({ apig, ...httpsInputs })
      outputs.https = true
    } else {
      this.context.debug(`Removing https for ${host}...`)
      // delete https
      const httpsInputs = {
        host: host,
        httpsType: 0
      }
      await SetHttpsInfo({ apig, ...httpsInputs })
      outputs.https = false
    }
    await waitForNotStatus(apig, host)

    this.state = state
    await this.save()

    return outputs
  }

  async remove(inputs = {}) {
    await this.initCredential()

    this.context.status('Removing')

    const apig = new Capi({
      SecretId: this.context.credentials.tencent.SecretId,
      SecretKey: this.context.credentials.tencent.SecretKey,
      serviceType: 'cdn',
      Token: this.context.credentials.tencent.token
    })

    const { state } = this
    // get host from cache state
    let { host } = state
    if (inputs.host) {
      // eslint-disable-next-line
      host = inputs.host
    }

    // need circle for deleting, after host status is 6, then we can delete it
    this.context.debug(`Start removing CDN for ${host}`)
    const { status } = await getCdnByHost(apig, host)
    state.status = status
    // status=5: online
    // state=4: deploying
    // state=6: offline
    if (status === 5) {
      // disable first
      await OfflineHost({
        apig,
        host: host
      })
      this.context.debug(`Waiting for offline ${host}...`)
      await waitForNotStatus(apig, host)
    } else if (status === 4) {
      this.context.debug(`Waiting for operational status for ${host}...`)
      await waitForNotStatus(apig, host)
    }
    this.context.debug(`Removing CDN for ${host}`)
    await DeleteCdnHost({
      apig: apig,
      host: host
    })
    this.context.debug(`Removed CDN for ${host}.`)
    this.state = {}
    await this.save()
    return {}
  }
}

module.exports = TencentCdn
