# Configure document

## Complete configuration

```yml
# serverless.yml

component: cdn
name: cdnDemo
org: orgDemo
app: appDemo
stage: dev

inputs:
  domain: abc.com
  area: overseas
  async: true
  onlyRefresh: false
  serviceType: web
  origin:
    origins:
      - origin.site.com
    originType: cos
    originPullProtocol: https
  refreshCdn:
    urls:
      - https://abc.com
  pushCdn:
    urls:
      - https://abc.com
  cache:
    simpleCache:
      followOrigin: on
      cacheRules:
        - cacheType: all
          cacheContents:
            - '*'
          cacheTime: 1000
  cacheKey:
    fullUrlCache: on
  referer:
    switch: on
    refererRules:
      - ruleType: all
        rulePaths:
          - '*'
        refererType: blacklist
        allowEmpty: true
        referers:
          - 'qq.baidu.com'
          - '*.baidu.com'
  ipFilter:
    switch: on
    filterType: blacklist
    filters:
      - '1.2.3.4'
      - '2.3.4.5'
  forceRedirect:
    switch: on
    redirectType: https
    redirectStatusCode: 301
  https:
    switch: on
    http2: on
    certInfo:
      certId: 'abc'
      # certificate: 'xxx'
      # privateKey: 'xxx'
```

### CDN 配置

| 参数名称    | 是否必选 | 默认       | 描述                                                                                                                                         |
| ----------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| domain      | 是       |            | 需要接入的 CDN 域名。                                                                                                                        |
| origin      | 是       |            | 源站配置，参考 [origin](#origin)                                                                                                             |  |
| area        | 否       | `mainland` | 域名加速区域，mainland：中国境内加速，overseas：中国境外加速，global：全球加速，（使用中国境外加速、全球加速时，需要先开通中国境外加速服务） |
| serviceType | 否       | `web`      | 加速域名业务类型。web：静态加速，download：下载加速，media：流媒体点播加速                                                                   |
| async       | 否       | `false`    | 是否为异步操作，如果为 true，则不会等待 CDN 创建或更新成功再返回。                                                                           |
| onlyRefresh | 否       | `false`    | 是否只刷新预热 CDN，如果为 `true`，那么只进行刷新操作，不会更新 CDN 配置                                                                     |
| refreshCdn  | 否       |            | 刷新 CDN 相关配置，参考 [refreshCdn](#refreshCdn)                                                                                            |
| pushCdn     | 否       |            | 预热 CDN 相关配置，参考 [pushCdn](#pushCdn)                                                                                                  |
| https       | 否       |            | Https 加速配置，参考：https://cloud.tencent.com/document/api/228/30987#Https                                                                 |
| cacheKey    | 否       |            | 节点缓存键配置，参考：https://cloud.tencent.com/document/api/228/30987#CacheKey                                                              |
| cache       | 否       |            | 缓存过期时间配置，参考： https://cloud.tencent.com/document/api/228/30987#Cache                                                              |
| referer     | 否       |            | 防盗链设置，参考： https://cloud.tencent.com/document/api/228/30987#Referer                                                                  |
| ipFilter    | 否       |            | IP 黑白名单配置，参考： https://cloud.tencent.com/document/api/228/30987#IpFilter                                                            |

> 注意：`async` 参数对于配置多个 CDN 域名需求，或者在 CI 流程中时，建议配置成 `true`，不然会导致 serverless cli 执行超时，或者 CI 流程超时。

#### origin

参考：https://cloud.tencent.com/document/api/228/30987#Origin

| 参数名称           | 是否必选 | 默认     | 描述                                                                                                                               |
| ------------------ | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| origins            | 是       |          | 主源站列表                                                                                                                         |
| originType         | 是       | `domain` | 主源站类型，domain：域名类型，cos：对象存储源站                                                                                    |
| originPullProtocol | 是       | `http`   | 回源协议配置，http：强制 http 回源，follow：协议跟随回源，https：强制 https 回源，https 回源时仅支持源站 443 端口                  |
| serverName         | 否       |          | 回主源站时 Host 头部，不填充则默认为加速域名。若接入的是泛域名，则回源 Host 默认为访问时的子域名                                   |
| cosPrivateAccess   | 否       |          | originType 为对象存储（COS）时，可以指定是否允许访问私有 bucket。注意：需要先授权 CDN 访问该私有 Bucket 的权限后，才可开启此配置。 |
| backupOrigins      | 否       |          | 备源站列表                                                                                                                         |
| backupOriginType   | 否       | `domain` | 备源站类型，domain：域名类型，cos：对象存储源站                                                                                    |
| backupServerName   | 否       |          | 回备源站时 Host 头部，不填充则默认为加速域名。若接入的是泛域名，则回源 Host 默认为访问时的子域名                                   |

#### refreshCdn

| 参数名称 | 是否必选 | 默认 | 描述                |
| -------- | -------- | ---- | ------------------- |
| urls     | 否       | []   | 需要刷新的 CDN 目录 |

#### pushCdn

| 参数名称 | 是否必选 | 默认 | 描述                |
| -------- | -------- | ---- | ------------------- |
| urls     | 否       | []   | 需要预热的 CDN URLs |

更多配置，请移至官方云 API 文档：https://cloud.tencent.com/document/product/228/41123
