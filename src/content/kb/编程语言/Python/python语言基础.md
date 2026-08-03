---
title: Python 语言基础速查
date: 2026-08-04
tags: [Python, 编程, 语法, 数据结构, 函数, 类, 正则, 文件]
summary: Python 语言基础速查：变量/数据结构/字符串/列表/字典/集合、函数、类与继承、正则、文件读写、异常处理。
---

> 个人 Python 学习笔记整理。核心特点：面向对象、缩进语法块、无需声明变量类型。

## 1. 基本语法特点

```text
面向对象：每个变量都是类，有自己的属性与方法
语法块：用缩进（4空格）标记，行首空格不能随意
注释：行内 # ；多行用三引号 '''...''' 或 """..."""
续行：行尾 \ 或语法未完成（如以逗号结尾）直接换行
打印/输入：print()（sep/end参数）、input()
变量：无需声明类型，del() 删除；a is b 判断是否同址
模块：import pandas as pd；from pandas import DataFrame
帮助：dir() 列出成员，help() 查看文档
```

变量复制注意：`b = a` 有时只复制引用，改动互相影响；`a is a[:]` 为 False（切片重新分配）。

## 2. 数据结构

### 数字（num）

```text
int / float；四则 + - * /，整除 //，取余 %，乘方 **
两数只要一个浮点，结果就是浮点；整除结果是浮点
Python 无整数溢出问题
```

### 布尔（bool）

```text
True/False；and / or / not
空列表[]、0 为 False；非空为 True
```

### 序列（sequence）：str / list / tuple

```text
索引从 0 到 N-1，支持负数（seq[-1]）
切片左闭右开：seq[0:2]、seq[2:]、seq[:3]、seq[::2]
len()；+ 连接、* 重复；in 判断；index() 定位
max()/min()；cmp() 比较
```

### 字符串（str）

```text
转义 \；r"c:\new" 原始字符串
.split() / .join() / .strip() 去首尾空格
大小写：title()/upper()/lower()/capitalize()
格式化：'{}'.format(x)，{:0>7.2f}、:^4d 等控制码
replace(old,new[,times]) / isdigit()
```

### 列表（list）

```text
list() 转换；reversed()/reverse()、append()/extend()/insert()/remove()/pop()
count()/sort(reverse=True)/clear()
```

### 元组（tuple）不可变

```python
() 空元组；(1,) 单元素需加逗号；(1) 是 int
```

### 字典（dict）

```text
键值对；d1.copy()、in 判断、del(d[key])、get(key,默认)
setdefault、items()/keys()/values()、pop/popitem、update
```

### 集合（set）无序唯一

```text
add()/update()、remove()/discard()
子集 issubset / 父集 issuperset
并集 |、交集 &、补集 -
```

## 3. 基本语句

```python
# if / elif / else，支持链式比较
a = 1 if 2 < 1 else 2   # 三元操作

# for in range(N,M,s)，可选 else（正常结束执行）
for i in range(3): print(i)
else: print("正常结束")

# while，可选 else
while count < 5: ...
else: ...

# 列表解析
lst = [x ** 2 for x in range(4) if x > 0]
# 字典解析 / 生成器解析
{n: n**2 for n in range(3)}
(i for i in range(10))
```

## 4. 函数

```python
def func(a, b=0):
    """docstring 帮助字符串"""
    return ...

# 不定参：*lst 解包为位置参数，**d 解包为关键字参数
print("{}+{}={}".format(*lst), "{a}+{b}={c}".format(**d))

# lambda 匿名函数
func = lambda x, y: x + y

# 高阶函数
list(map(lambda x: x+1, range(5)))       # map
list(filter(lambda x: x>0, range(-3,3))) # filter
from functools import reduce
reduce(lambda x,y: x+y, range(5))        # reduce
for i, v in enumerate(a): ...            # enumerate
```

装饰器（函数的函数）：

```python
import functools
def showname(num=1):
    def decorator(func):
        @functools.wraps(func)   # 保留原函数 __name__
        def subfunc(*args, **kwarg):
            print("FUNCTION {} called.".format(func.__name__))
            return func(*args, **kwarg)
        return subfunc
    return decorator

@showname(2)
def pyrint(data="Python"):
    return data.upper()
```

## 5. 迭代器与生成器

```python
# 迭代器：有 __iter__() 和 __next__()
b = iter([1,2,3]); next(b)

import itertools
p = itertools.count(start=1, step=0.5)     # 无穷等差
p = itertools.cycle(list("AB"))            # 周期循环
list(itertools.islice(p, 0, 4))            # 切片截取

# 生成器：含 yield 的函数
def iterFib():
    former, later = 0, 1
    while True:
        yield later
        former, later = later, later + former
list(itertools.islice(iterFib(), 0, 5))
```

## 6. 异常处理

```python
try:
    a = 1 / 0
except ZeroDivisionError as e:
    print(e); exit()
except Exception:
    print("Exception")
else:          # 无错误时
    print(a)
finally:       # 总是执行
    print("-- End --")

# 错误继承：子错误放在父错误之前捕获
# raise ValueError("...") 抛出/上抛错误
```

常见错误：ZeroDivisionError、SyntaxError、IndexError、KeyError、IOError。

## 7. 文件读写

```python
import os
# 读整个文件 / 读列表 / 大文件逐行
with open("data.txt", "r", encoding="utf8") as f:
    rawtext = f.read()      # 整个文件为字符串
    lines = f.readlines()   # 每行一个元素
    line = f.readline()     # 迭代式读取

# 写
with open("data.txt", "w") as f:
    f.write("content")

# 指针
f.tell()   # 当前位置
f.seek(0)  # 回到文件头

# 模式：r读 / w写(覆盖) / x新建 / a追加
```

## 8. 类

```python
class MyClass:
    animal = "cat"          # 属性
    def __init__(self, animal="cat"):   # 构造函数
        self.animal = animal
    def talk(self):          # 方法（self 首位）
        return "Meow"

# 封装：双下划线前缀私有
class MyClass3:
    def __init__(self):
        self.__animal = "cat"   # 私有
    def show(self):
        print(self.__animal)

# 继承
class Animal:
    def talk(self): pass
class Cat(Animal):
    def talk(self): print('Meow')
isinstance(a, Cat)   # 判断实例

# 多继承：左侧优先

# @property 装饰器：方法伪装成属性（getter/setter）
@property
def age(self): return self.__age
@age.setter
def age(self, value): ...

# __slots__：限制属性（防外部追加，优化内存）
# 运算符重载：__add__/__sub__/__neg__/__str__/__len__ 等
# 迭代行为：__iter__() + __next__()
```

类的特殊属性：`__dict__`（属性字典）、`__slots__`、`__name__`。

## 9. 常用模块

```text
os      os.getcwd/rename/remove/stat、path.join/isfile/exists、mkdir/listdir
sys     sys.argv 命令行参数、sys.platform、sys.exit
re      正则（见下）
collections  deque 双端队列、defaultdict 缺省字典
itertools  迭代器工具
logging 日志（DEBUG/INFO/WARNING/ERROR/CRITICAL，basicConfig）
urllib  HTML 请求（爬虫）
```

## 10. 调试与测试

```python
assert(n != 0)          # 断言，可用 -O 忽略
# logging 调试
import logging
logging.basicConfig(level=logging.WARNING)
logging.warning("n = {}".format(n))
```

## 11. 正则表达式（re）

```python
import re
re.compile(exp)                # 编译（供多次使用）
re.compile(exp).match(str)     # 判断是否匹配
re.compile(exp).findall(str)   # 找所有匹配子串
re.split(exp, str)             # 正则分割

# 元字符
\d 数字  \D 非数字  \w 数字字母下划线  \W 非  \s 空白  \S 非  . 非换行任意
# 限定符
* 0~无数  ? 0~1  + 1~无数  {n}  {n,}  {n,m}
# 边界
^ 开头  $ 结尾
# 特殊
() 分组  | 或  [] 范围  [^] 非  \ 转义
# 标识
i 忽略大小写  g 全局捕获
# 贪婪 vs 非贪婪：.* 贪婪，.*? 非贪婪

# 字符串方法
str.search(reg) / str.match(reg) / str.replace(reg, 替换)
```

---

> **一句话总结**：Python 靠"缩进 + 鸭子类型 + 丰富的内置结构"取胜。掌握序列/字典/集合三大结构、函数（lambda/装饰器/生成器）、类（封装/继承/property）、正则，就能处理绝大多数脚本任务。
