---
title: AES 加密模式对比
date: 2026-07-20
tags: [AES, 对称加密, 密码学基础]
summary: ECB、CBC、CTR、GCM 四种模式的原理、优缺点及使用场景对比。
---

| 模式 | 全称 | 特点 | 并行 | 完整性 | 推荐 |
|------|------|------|------|--------|------|
| ECB | Electronic Codebook | 同明文→同密文，不安全 | ✅ | ❌ | ❌ 永远别用 |
| CBC | Cipher Block Chaining | 前块异或后块，需 IV | 解密✅ | ❌ | ⚠️ 需配合 HMAC |
| CTR | Counter | 流密码模式，nonce+计数器 | ✅ | ❌ | ⚠️ 需配合 HMAC |
| GCM | Galois/Counter Mode | CTR + GHASH 认证 | ✅ | ✅ | ✅ **推荐** |

## 推荐做法

```
AES-256-GCM + 随机 12 字节 nonce
```

GCM 同时提供加密和完整性校验，是目前工业标准。

## 代码

```python
from Crypto.Cipher import AES
import os

def aes_gcm_encrypt(plaintext: bytes, key: bytes) -> bytes:
    nonce = os.urandom(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ct, tag = cipher.encrypt_and_digest(plaintext)
    return nonce + tag + ct  # 拼接: nonce(12) + tag(16) + ciphertext

def aes_gcm_decrypt(packed: bytes, key: bytes) -> bytes:
    nonce, tag, ct = packed[:12], packed[12:28], packed[28:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ct, tag)
```
