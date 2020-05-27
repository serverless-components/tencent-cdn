# 腾讯云 CDN 组件

简体中文 | [English](./README.en.md)

## 简介

通过 CDN 组件，可以快速方便的创建，配置和管理腾讯云的 CDN 产品。

## 快速开始

&nbsp;

1. [安装](#1-安装)
2. [配置](#2-配置)
3. [部署](#3-部署)
4. [移除](#4-移除)

&nbsp;

### 1. 安装

通过 npm 安装 serverless

```shell
$ npm install -g serverless
```

### 2. 配置

本地创建 `serverless.yml` 文件，在其中进行如下配置

```shell
$ touch serverless.yml
```

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
  autoRefesh: true
  forceRedirect:
    switch: on
    redirectType: https
    redirectStatusCode: 301
  https:
    switch: on
    http2: on
    certInfo:
      certId: 'abc'
```

- [更多配置](./docs/configure.md)

### 3. 部署

如您的账号未[登陆](https://cloud.tencent.com/login)或[注册](https://cloud.tencent.com/register)腾讯云，您可以直接通过`微信`扫描命令行中的二维码进行授权登陆和注册。

同时需要到 [内容分发网络](https://console.cloud.tencent.com/cdn) 开通该服务。

```bash
$ sls deploy
```

### 4. 移除

通过以下命令移除部署的 CDN 配置：

```bash
$ sls remove
```

### 账号配置（可选）

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```shell
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存

如果没有腾讯云账号，可以在此[注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在[API 密钥管理](https://console.cloud.tencent.com/cam/capi)中获取 `SecretId` 和`SecretKey`.

```text
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

### 还支持哪些组件？

可以在 [Serverless Components](https://github.com/serverless/components) repo 中查询更多组件的信息。

## License

MIT License

Copyright (c) 2020 Tencent Cloud, Inc.
