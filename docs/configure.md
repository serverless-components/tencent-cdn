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
  async: true
  onlyRefresh: false
  autoRefesh: true
  refreshCdn:
    urls:
      - https://abc.com
      - http://abc.com
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

| 参数名称   | 是否必选 | 默认    | 描述                                                                              |
| ---------- | -------- | ------- | --------------------------------------------------------------------------------- |
| async      | 否       | `false` | 是否为异步操作，如果为 true，则不会等待 CDN 创建或更新成功再返回，                |
| autoRefesh | 否       | `false` | 是否自动刷新预热 CDN                                                              |
| onlyRefesh | 否       | `false` | 是否只刷新预热 CDN，如果为 `true`，那么只进行刷新预热操作，不会更新 CDN 配置      |
| refreshCdn | 否       |         | 刷新 CDN 相关配置，参考 [refreshCdn](#refreshCdn)                                 |
| host       | 是       |         | 需要接入的 CDN 域名。                                                             |
| host       | 是       |         | 需要接入的 CDN 域名。                                                             |
| https      | 否       |         | Https 加速配置，参考：https://cloud.tencent.com/document/api/228/30987#Https      |
| cacheKey   | 否       |         | 节点缓存键配置，参考：https://cloud.tencent.com/document/api/228/30987#CacheKey   |
| cache      | 否       |         | 缓存过期时间配置，参考： https://cloud.tencent.com/document/api/228/30987#Cache   |
| referer    | 否       | ''      | 防盗链设置，参考： https://cloud.tencent.com/document/api/228/30987#Referer       |
| ipFilter   | 否       | ''      | IP 黑白名单配置，参考： https://cloud.tencent.com/document/api/228/30987#IpFilter |

> 注意：`async` 参数对于配置多个 CDN 域名需求，或者在 CI 流程中时，建议配置成 `true`，不然会导致 serverless cli 执行超时，或者 CI 流程超时。

#### refreshCdn

| 参数名称 | 是否必选 | 默认 | 描述                |
| -------- | -------- | ---- | ------------------- |
| urls     | 否       | []   | 需要刷新的 CDN URLs |

更多配置，请移至官方云 API 文档：https://cloud.tencent.com/document/product/228/41123
