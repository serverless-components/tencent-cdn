# Tencent CDN Component

[简体中文](./README.md) | English

Easily provision Tencent CDN using [Serverless Components](https://github.com/serverless/components).

## Quick start

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)
5. [Remove](#5-Remove)

### 1. Install

Install the Serverless Framework:

```shell
$ npm install -g serverless
```

### 2. Create

Just create the following simple boilerplate:

```shell
$ touch serverless.yml
$ touch .env           # your Tencent api keys
```

Add the access keys of a [Tencent CAM Role](https://console.cloud.tencent.com/cam/capi) with `AdministratorAccess` in the `.env` file, using this format:

```
# .env
TENCENT_SECRET_ID=XXX
TENCENT_SECRET_KEY=XXX
```

- If you don't have a Tencent Cloud account, you could [sign up](https://intl.cloud.tencent.com/register) first.

Also should goto [CDN Service Page](https://console.cloud.tencent.com/cdn), and open CDN service。

### 3. Configure

```yml
# serverless.yml

component: cdn
name: cdnDemo
org: orgDemo
app: appDemo
stage: dev

inputs:
  area: overseas
  domain: abc.com
  origin:
    origins:
      - xxx.cos-website.ap-guangzhou.myqcloud.com
    originType: cos
    originPullProtocol: http
```

- [More configuration](./docs/configure.md)

### 4. Deploy

```bash
$ sls deploy
```

&nbsp;

### 5. Remove

```bash
$ sls remove
```

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.

## License

MIT License

Copyright (c) 2020 Tencent Cloud, Inc.
