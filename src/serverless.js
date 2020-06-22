const { Component } = require('@serverless/core')
const { Cdn } = require('tencent-component-toolkit')
const { TypeError } = require('tencent-component-toolkit/src/utils/error')

class ServerlessComponent extends Component {
  getCredentials() {
    const { tmpSecrets } = this.credentials.tencent

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new TypeError(
        'CREDENTIAL',
        'Cannot get secretId/Key, your account could be sub-account and does not have the access to use SLS_QcsRole, please make sure the role exists first, then visit https://cloud.tencent.com/document/product/1154/43006, follow the instructions to bind the role to your account.'
      )
    }

    return {
      SecretId: tmpSecrets.TmpSecretId,
      SecretKey: tmpSecrets.TmpSecretKey,
      Token: tmpSecrets.Token
    }
  }

  async deploy(inputs) {
    console.log(`Deploying CDN...`)

    // get tencent cloud credentials
    const credentials = this.getCredentials()

    const cdn = new Cdn(credentials)

    inputs.oldState = this.state
    const deployRes = await cdn.deploy(inputs)
    this.state = deployRes

    const outputs = {
      domain: inputs.domain,
      cname: `${inputs.domain}.cdn.dnsv1.com`,
      origins: deployRes.origins
    }

    return outputs
  }

  async remove() {
    const { domain } = this.state
    if (!domain) {
      console.log(`CDN domian not exist`)
      return {}
    }
    console.log(`Removing CDN domain ${domain}...`)

    // get tencent cloud credentials
    const credentials = this.getCredentials()

    const cdn = new Cdn(credentials)
    await cdn.remove({ domain })
    this.state = {}
    return {}
  }
}

module.exports = ServerlessComponent
