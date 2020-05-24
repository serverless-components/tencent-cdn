const { Component } = require('@serverless/core')
const { Cdn } = require('tencent-component-toolkit')

class ServerlessComponent extends Component {
  getCredentials() {
    const { tmpSecrets } = this.credentials.tencent

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new Error(
        'Cannot get secretId/Key, your account could be sub-account or does not have access, please check if SLS_QcsRole role exists in your account, and visit https://console.cloud.tencent.com/cam to bind this role to your account.'
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
      origin: deployRes.origin
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
