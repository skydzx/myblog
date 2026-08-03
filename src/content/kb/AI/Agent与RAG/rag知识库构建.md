---
title: RAG 知识库构建（LangChain + Chroma）
date: 2026-08-04
tags: [RAG, LangChain, Chroma, 向量数据库, Embedding, 检索增强生成]
summary: 用 LangChain + Chroma 构建向量知识库：文档加载、递归分割、Embedding 向量化、相似度检索、RAG 问答链。
---

> 个人 RAG 项目笔记整理。核心流程：Markdown 文档 → 分割小块 → Embedding 转向量 → 存 ChromaDB → 检索 + LLM 生成。

## 1. 整体流程

```
Markdown文件 → 加载成Document对象 → 切成小块 → 转成向量 → 存向量数据库
        ↓
查询时：问题 → 转向量 → 相似度检索top-k → 组合上下文 → LLM生成答案
```

## 2. 构建知识库（build_knowledge_base.py）

### 加载文档

```python
from pathlib import Path
from langchain_community.document_loaders import TextLoader

md_files = list(Path(docs_dir).rglob("*.md"))   # 递归找所有 .md
documents = []
for md_file in md_files:
    loader = TextLoader(str(md_file), encoding='utf-8')
    documents.extend(loader.load())              # 文件 → Document 对象
```

Document 对象：`page_content`（文本）+ `metadata`（如源文件路径）。

### 分割文档

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,        # 每块目标 1000 字符
    chunk_overlap=200,      # 相邻块重叠 200（保持上下文，避免句中断）
    separators=["\n\n", "\n", "。", "！", "？", "；", " ", ""]  # 分隔符优先级
)
splits = text_splitter.split_documents(documents)
```

为什么重叠：避免在句子中间切断，保持上下文连续性，提高检索准确率。

### 向量化 + 存库

```python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",  # 多语言
    model_kwargs={'device': 'cpu'}
)

vectorstore = Chroma.from_documents(
    documents=splits,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

```text
模型：paraphrase-multilingual-MiniLM-L12-v2，384维，支持中文
首次运行下载约 400MB+
库里存：向量 + 原文 + 元数据
```

## 3. 查询（query_knowledge_base.py）

### 连接 LLM（Ollama）

```python
from langchain_community.chat_models import ChatOllama

def get_llm(model_name="qwen3:32b"):
    return ChatOllama(base_url="http://192.168.2.241:11434", model=model_name)
# 可选模型：qwen3:32b / deepseek-r1:32b / deepseek-coder:33b / gpt-oss:120b
```

### 创建问答链

```python
from langchain_core.prompts import PromptTemplate
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

PROMPT = PromptTemplate.from_template("""你是WebShell检测领域的专家助手。
基于以下上下文回答问题：
{context}
问题：{input}
回答：""")

retriever = vectorstore.as_retriever(search_kwargs={"k": 4})  # 检索最相关4段

# 方式1：官方 API
document_chain = create_stuff_documents_chain(llm, PROMPT)
qa_chain = create_retrieval_chain(retriever, document_chain)

# 方式2：手动链（兼容旧版本）
qa_chain = (
    {"context": retriever | format_docs, "input": RunnablePassthrough()}
    | PROMPT | llm | StrOutputParser()
)
```

### 执行查询

```python
result = qa_chain.invoke({"input": question})
answer = result.get("answer", result.get("result", ""))
source_docs = result.get("context", [])
# 显示答案 + 参考来源（doc.metadata.get('source')）
```

## 4. 关键技术点

```text
RAG = 检索（找相关文档）+ 增强（文档作上下文）+ 生成（LLM 基于上下文回答）
向量相似度检索：问题转向量 → 与库中向量算余弦相似度 → 返回 top-k
Embedding 模型必须与构建时一致，否则检索失效
```

## 5. 性能与优化

```text
首次运行：下载 embedding 模型 + 向量化 + 建索引（较慢）
GPU 加速：model_kwargs={'device': 'cuda'}
chunk_size 调大 → 块少但精度降；调小 → 精确但数量多
chunk_overlap 调大 → 连续性高但存储多
新增文档需要重新构建知识库
```

---

> **一句话总结**：RAG 知识库 = 文档切割（chunk + overlap）→ Embedding 向量化 → ChromaDB 存储 → 查询时相似度检索 top-k 拼进 prompt 让 LLM 回答。Embedding 模型一致性是关键。
