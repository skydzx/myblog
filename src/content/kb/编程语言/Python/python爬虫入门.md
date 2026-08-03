---
title: Python 爬虫入门（requests + re）
date: 2026-08-04
tags: [Python, 爬虫, requests, 正则, re, 图片下载]
summary: Python 爬虫入门实战：requests 请求 + re 正则匹配 + os 保存，以图片网站抓取为例。
---

> 个人爬虫学习笔记。以抓取彼岸图网图片为例，演示完整流程。

## 1. 导入库 + 请求参数

```python
import requests

url = "https://pic.netbian.com/uploads/allimg/210317/001935-16159115757f04.jpg"
headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36"
}

response = requests.get(url=url, headers=headers)
print(response.text)   # 打印网页源码
```

关键参数：

```text
Request URL    请求的网站地址
user-agent     模拟浏览器访问，避免被检测为非法访问
```

## 2. 乱码处理

```python
# 通过 apparent_encoding 获取网页编码并解码
response.encoding = response.apparent_encoding
print(response.text)
```

## 3. 正则匹配内容

```python
import re

# src后面是链接，alt是图片名字
# 限定 /u 开头避免匹配到其他图片
parr = re.compile('src="(/u.*?)".alt="(.*?)"')
image = re.findall(parr, response.text)

for content in image:
    print(content)

# image[0][0] = 链接，image[0][1] = 名字
```

正则基础：`.` 任意字符、`*` 零次多次、`?` 零次一次、`.*?` 非贪婪匹配。

## 4. 保存图片

```python
import os
path = "图片文件夹"
if not os.path.isdir(path):
    os.mkdir(path)

for i in image:
    link = "https://pic.netbian.com" + i[0]   # 补全相对链接
    name = i[1]
    with open(f"{path}/{name}.jpg", "wb") as img:
        res = requests.get(link)
        img.write(res.content)
    print(name + ".jpg 获取成功")
```

## 5. 完整代码

```python
import requests
import re
import os

url = "https://pic.netbian.com/"
headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36"
}

response = requests.get(url=url, headers=headers)
response.encoding = response.apparent_encoding

parr = re.compile('src="(/u.*?)".alt="(.*?)"')
image = re.findall(parr, response.text)

path = "图片文件夹"
if not os.path.isdir(path):
    os.mkdir(path)

for i in image:
    link = "https://pic.netbian.com" + i[0]
    name = i[1]
    with open(f"{path}/{name}.jpg", "wb") as img:
        res = requests.get(link)
        img.write(res.content)
    print(name + ".jpg 获取成功")
```

---

> **一句话总结**：爬虫三板斧 = `requests` 带 headers 发请求 → `re.findall` 匹配目标内容 → `os` + `with open` 保存文件。乱码用 `response.apparent_encoding` 解决。
