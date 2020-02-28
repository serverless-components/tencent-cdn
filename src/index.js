const { Component } = require('@serverless/core')
const { Capi } = require('@tencent-sdk/capi')
const tencentAuth = require('serverless-tencent-auth-tool')
const { AddCdnHost, SetHttpsInfo, UpdateCdnConfig, OfflineHost, DeleteCdnHost } = require('./apis')
const {
  formatCache,
  formatRefer,
  getCdnByHost,
  waitForNotStatus,
  getPathContent
} = require('./utils')

class TencentCdn extends Component {
  async initCredential(inputs, action) {
    // login
    const auth = new tencentAuth()
    this.context.credentials.tencent = await auth.doAuth(this.context.credentials.tencent, {
      client: 'tencent-cdn',
      remark: inputs.fromClientRemark,
      project: this.context.instance ? this.context.instance.id : undefined,
      action: action
    })
    if (this.context.credentials.tencent && this.context.credentials.tencent.token) {
      this.context.credentials.tencent.Token = this.context.credentials.tencent.token
    }
  }

  async default(inputs = {}) {
    await this.initCredential(inputs, 'default')

    inputs.projectId = 0
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
    } = inputs

    const capi = new Capi({
      AppId: this.context.credentials.tencent.AppId,
      SecretId: this.context.credentials.tencent.SecretId,
      SecretKey: this.context.credentials.tencent.SecretKey,
      Token: this.context.credentials.tencent.Token
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

    const cdnInfo = await getCdnByHost(capi, host)

    const sourceInputs = JSON.parse(JSON.stringify(inputs))
    const sourceHttpsConf = sourceInputs.https
    const sourceBaseConf = {}
    Object.keys(sourceInputs).forEach((key) => {
      if (key !== 'https') {
        sourceBaseConf[key] = sourceInputs[key]
      }
    })
    const state = {
      host: host,
      origin: origin,
      cname: `${host}.cdn.dnsv1.com`,
      inputCache: {
        base: JSON.stringify(sourceBaseConf),
        https: JSON.stringify(sourceHttpsConf)
      }
    }
    const outputs = {
      host: host,
      origin: origin,
      cname: `${host}.cdn.dnsv1.com`
    }

    const createOrUpdateCdn = async () => {
      if (cdnInfo) {
        // update
        this.context.debug(`The CDN domain ${host} has existed.`)
        this.context.debug('Updating...')
        cdnInputs.hostId = cdnInfo.id
        await UpdateCdnConfig(capi, cdnInputs)
        state.hostId = cdnInfo.id
        state.updated = true
        outputs.hostId = cdnInfo.id
      } else {
        // create
        this.context.debug(`Adding CDN domain ${host}...`)
        try {
          await AddCdnHost(capi, cdnInputs)
        } catch (e) {
          if (e.code === 9111) {
            this.context.debug(
              `Please goto https://console.cloud.tencent.com/cdn open CDN service.`
            )
          }
          throw e
        }
        const { id } = await getCdnByHost(capi, host)
        state.hostId = id
        state.created = true
        outputs.hostId = id
      }

      // state=4: deploying status, we can not do any operation
      this.context.debug('Waiting for CDN deploy success...')
      await waitForNotStatus(capi, host)
      this.context.debug(`CDN deploy success to host: ${host}`)
    }

    const creatOrUpdateHttps = async () => {
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

        await SetHttpsInfo(capi, httpsInputs)
        outputs.https = true
      } else {
        this.context.debug(`Removing https for ${host}...`)
        // delete https
        const httpsInputs = {
          host: host,
          httpsType: 0
        }
        await SetHttpsInfo(capi, httpsInputs)
        outputs.https = false
      }
      await waitForNotStatus(capi, host)
    }

    const { inputCache } = this.state
    if (inputCache && inputCache.base === JSON.stringify(sourceBaseConf)) {
      this.context.debug(`No base configuration changes for CDN domain ${host}`)
      outputs.hostId = cdnInfo.id
    } else {
      await createOrUpdateCdn()
    }

    if (inputCache && inputCache.https === JSON.stringify(sourceHttpsConf)) {
      this.context.debug(`No https configuration changes for CDN domain ${host}`)
      outputs.https = !!sourceHttpsConf
    } else {
      await creatOrUpdateHttps()
    }

    this.state = state
    await this.save()

    return outputs
  }

  async remove(inputs = {}) {
    await this.initCredential(inputs, 'remove')

    this.context.status('Removing')

    const capi = new Capi({
      SecretId: this.context.credentials.tencent.SecretId,
      SecretKey: this.context.credentials.tencent.SecretKey,
      Token: this.context.credentials.tencent.Token
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
    const { status } = await getCdnByHost(capi, host)
    state.status = status
    // status=5: online
    // state=4: deploying
    // state=6: offline
    if (status === 5) {
      // disable first
      await OfflineHost(capi, { host: host })
      this.context.debug(`Waiting for offline ${host}...`)
      await waitForNotStatus(capi, host)
    } else if (status === 4) {
      this.context.debug(`Waiting for operational status for ${host}...`)
      await waitForNotStatus(capi, host)
    }
    this.context.debug(`Removing CDN for ${host}`)
    await DeleteCdnHost(capi, { host: host })
    this.context.debug(`Removed CDN for ${host}.`)
    this.state = {}
    await this.save()
    return {}
  }
}

module.exports = TencentCdn
