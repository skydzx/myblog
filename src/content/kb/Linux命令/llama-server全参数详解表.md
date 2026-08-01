---
title: llama-server 全参数详解
date: 2026-08-01
tags: [llama.cpp, llama-server, LLM, 推理引擎, 参数配置]
summary: llama-server 全部命令行参数的完整速查表，按通用/采样/推测解码/服务器四大类分组。
---

> 基于 llama.cpp 最新版，覆盖通用参数、采样参数、推测解码参数、服务器与示例参数四大类。


## 通用参数

控制模型加载、线程、上下文窗口、批处理、Flash Attention 等基础配置。

| 参数 | 简写 | 默认值 | 环境变量 | 说明 |
|------|------|--------|----------|------|
| `--help` | -h, --usage | - | - | 打印用法信息并退出 |
| `--version` | - | - | - | 显示版本和构建信息 |
| `--license` | - | - | - | 显示源代码许可证和依赖项 |
| `--cache-list` | -cl | - | - | 显示缓存中的模型列表 |
| `--completion-bash` | - | - | - | 打印可 source 的 bash 自动补全脚本 |
| `--threads` | -t | -1（自动） | LLAMA_ARG_THREADS | 生成时使用的 CPU 线程数，-1 表示自动检测 |
| `--threads-batch` | -tb | 同 --threads | - | 批处理和 prompt 处理时使用的线程数 |
| `--cpu-mask` | -C | "" | - | CPU 亲和性掩码（任意长度十六进制），与 cpu-range 互补 |
| `--cpu-range` | -Cr | - | - | CPU 亲和性范围（lo-hi），与 --cpu-mask 互补 |
| `--cpu-strict` | - | 0 | - | 是否使用严格 CPU 放置（0=否，1=是） |
| `--prio` | - | 0 | - | 进程/线程优先级：low(-1), normal(0), medium(1), high(2), realtime(3) |
| `--poll` | - | 50 | - | 等待工作时的轮询级别（0=不轮询，范围 0~100） |
| `--cpu-mask-batch` | -Cb | 同 --cpu-mask | - | 批处理时的 CPU 亲和性掩码 |
| `--cpu-range-batch` | -Crb | - | - | 批处理时的 CPU 亲和性范围 |
| `--cpu-strict-batch` | - | 同 --cpu-strict | - | 批处理时是否使用严格 CPU 放置 |
| `--prio-batch` | - | 0 | - | 批处理时的进程/线程优先级 |
| `--poll-batch` | - | 同 --poll | - | 批处理时是否使用轮询等待 |
| `--ctx-size` | -c | 0（从模型加载） | LLAMA_ARG_CTX_SIZE | prompt 上下文大小，0 表示使用模型自带值 |
| `--predict / --n-predict` | -n | -1（无限） | LLAMA_ARG_N_PREDICT | 要预测的 token 数量，-1 表示无限制 |
| `--batch-size` | -b | 2048 | LLAMA_ARG_BATCH | 逻辑最大批处理大小 |
| `--ubatch-size` | -ub | 512 | LLAMA_ARG_UBATCH | 物理最大批处理大小 |
| `--keep` | - | 0 | - | 从初始 prompt 中保留的 token 数（-1=全部保留） |
| `--swa-full` | - | false | LLAMA_ARG_SWA_FULL | 使用完整大小的 SWA（滑动窗口注意力）缓存 |
| `--flash-attn` | -fa | auto | LLAMA_ARG_FLASH_ATTN | Flash Attention 模式：on / off / auto |
| `--perf / --no-perf` | - | false | LLAMA_ARG_PERF | 是否启用 libllama 内部性能计时 |
| `--escape / --no-escape` | -e | true | - | 是否处理转义序列（\n, \r, \t, \', \", \\） |
| `--rope-scaling` | - | 模型指定（默认 linear） | LLAMA_ARG_ROPE_SCALING_TYPE | RoPE 频率缩放方法：none / linear / yarn |
| `--rope-scale` | - | - | LLAMA_ARG_ROPE_SCALE | RoPE 上下文缩放因子，将上下文扩展 N 倍 |
| `--rope-freq-base` | - | 从模型加载 | LLAMA_ARG_ROPE_FREQ_BASE | RoPE 基础频率，用于 NTK-aware 缩放 |
| `--rope-freq-scale` | - | - | LLAMA_ARG_ROPE_FREQ_SCALE | RoPE 频率缩放因子，将上下文扩展 1/N 倍 |
| `--yarn-orig-ctx` | - | 0（模型训练上下文） | LLAMA_ARG_YARN_ORIG_CTX | YaRN：模型原始上下文大小 |
| `--yarn-ext-factor` | - | -1.00 | LLAMA_ARG_YARN_EXT_FACTOR | YaRN：外推混合因子（0.0=完全插值） |
| `--yarn-attn-factor` | - | -1.00 | LLAMA_ARG_YARN_ATTN_FACTOR | YaRN：缩放 sqrt(t) 或注意力幅度 |
| `--yarn-beta-slow` | - | -1.00 | LLAMA_ARG_YARN_BETA_SLOW | YaRN：高修正维度（alpha） |
| `--yarn-beta-fast` | - | -1.00 | LLAMA_ARG_YARN_BETA_FAST | YaRN：低修正维度（beta） |
| `--kv-offload / --no-kv-offload` | -kvo / -nkvo | 启用 | LLAMA_ARG_KV_OFFLOAD | 是否启用 KV 缓存卸载到 GPU |
| `--repack / --no-repack` | -nr | 启用 | LLAMA_ARG_REPACK | 是否启用权重重打包 |
| `--no-host` | - | - | LLAMA_ARG_NO_HOST | 绕过主机缓冲区，允许使用额外缓冲区 |
| `--cache-type-k` | -ctk | f16 | LLAMA_ARG_CACHE_TYPE_K | KV 缓存中 K 的数据类型（f32/f16/bf16/q8_0/q4_0/q4_1/iq4_nl/q5_0/q5_1） |
| `--cache-type-v` | -ctv | f16 | LLAMA_ARG_CACHE_TYPE_V | KV 缓存中 V 的数据类型（同上） |
| `--defrag-thold` | -dt | - | LLAMA_ARG_DEFRAG_THOLD | KV 缓存碎片整理阈值（已弃用） |
| `--mlock` | - | - | LLAMA_ARG_MLOCK | 强制系统将模型保留在 RAM 中，禁止交换或压缩 |
| `--mmap / --no-mmap` | - | 启用 | LLAMA_ARG_MMAP | 是否使用内存映射加载模型（禁用后加载更慢但可能减少缺页） |
| `--direct-io / --no-direct-io` | -dio / -ndio | 禁用 | LLAMA_ARG_DIO | 是否使用 DirectIO（如果可用） |
| `--numa` | - | - | LLAMA_ARG_NUMA | NUMA 优化策略：distribute（均匀分布）/ isolate（仅当前节点）/ numactl（使用 numactl 提供的 CPU 映射） |
| `--device` | -dev | - | LLAMA_ARG_DEVICE | 用于卸载的逗号分隔设备列表（none=不卸载），用 --list-devices 查看可用设备 |
| `--list-devices` | - | - | - | 打印可用设备列表并退出 |
| `--override-tensor` | -ot | - | LLAMA_ARG_OVERRIDE_TENSOR | 覆盖张量缓冲区类型（格式：<tensor name pattern>=<buffer type>,...） |
| `--cpu-moe` | -cmoe | - | LLAMA_ARG_CPU_MOE | 将所有 MoE（混合专家）权重保留在 CPU 中 |
| `--n-cpu-moe` | -ncmoe | - | LLAMA_ARG_N_CPU_MOE | 将前 N 层的 MoE 权重保留在 CPU 中 |
| `--gpu-layers / --n-gpu-layers` | -ngl | auto | LLAMA_ARG_N_GPU_LAYERS | 存储在 VRAM 中的最大层数（具体数字 / auto / all） |
| `--split-mode` | -sm | layer | LLAMA_ARG_SPLIT_MODE | 多 GPU 模型拆分方式：none（单GPU）/ layer（按层流水线）/ row（按行并行）/ tensor（张量并行，实验性） |
| `--tensor-split` | -ts | - | LLAMA_ARG_TENSOR_SPLIT | 每个 GPU 卸载模型的比例（逗号分隔，如 3,1） |
| `--main-gpu` | -mg | 0 | LLAMA_ARG_MAIN_GPU | 主 GPU 索引（split-mode=none 时用于模型，row 时用于中间结果和 KV） |
| `--fit` | -fit | on | LLAMA_ARG_FIT | 是否自动调整未设置的参数以适应设备内存 |
| `--fit-target` | -fitt | 1024 | LLAMA_ARG_FIT_TARGET | --fit 的每设备目标余量（MiB），逗号分隔，单值广播到所有设备 |
| `--fit-ctx` | -fitc | 4096 | LLAMA_ARG_FIT_CTX | --fit 可设置的最小上下文大小 |
| `--check-tensors` | - | false | - | 检查模型张量数据中的无效值 |
| `--override-kv` | - | - | - | 高级选项：按键覆盖模型元数据（格式：KEY=TYPE:VALUE,...，类型：int/float/bool/str） |
| `--op-offload / --no-op-offload` | - | true | - | 是否将主机张量操作卸载到设备 |
| `--lora` | - | - | - | LoRA 适配器路径（逗号分隔可加载多个） |
| `--lora-scaled` | - | - | - | 带用户自定义缩放的 LoRA 适配器（格式：FNAME:SCALE,...） |
| `--control-vector` | - | - | - | 添加控制向量（逗号分隔可添加多个） |
| `--control-vector-scaled` | - | - | - | 带用户自定义缩放的控制向量（格式：FNAME:SCALE,...） |
| `--control-vector-layer-range` | - | - | - | 应用控制向量的层范围（START END，含首尾） |
| `--model` | -m | - | LLAMA_ARG_MODEL | 要加载的模型文件路径 |
| `--model-url` | -mu | 未使用 | LLAMA_ARG_MODEL_URL | 模型下载 URL |
| `--docker-repo` | -dr | 未使用 | LLAMA_ARG_DOCKER_REPO | Docker Hub 模型仓库（格式：[<repo>/]<model>[:quant]，默认 repo=ai/，默认 quant=:latest） |
| `--hf-repo` | -hf, -hfr | 未使用 | LLAMA_ARG_HF_REPO | Hugging Face 模型仓库（格式：<user>/<model>[:quant]，默认 Q4_K_M，自动下载 mmproj） |
| `--hf-file` | -hff | 未使用 | LLAMA_ARG_HF_FILE | Hugging Face 模型文件（覆盖 --hf-repo 中的 quant） |
| `--hf-repo-v` | -hfv, -hfrv | 未使用 | LLAMA_ARG_HF_REPO_V | 声码器模型的 Hugging Face 仓库 |
| `--hf-file-v` | -hffv | 未使用 | LLAMA_ARG_HF_FILE_V | 声码器模型的 Hugging Face 文件 |
| `--hf-token` | -hft | HF_TOKEN 环境变量 | HF_TOKEN | Hugging Face 访问令牌 |
| `--log-disable` | - | - | - | 禁用日志 |
| `--log-file` | - | - | LLAMA_LOG_FILE | 日志输出到文件 |
| `--log-colors` | - | auto | LLAMA_LOG_COLORS | 彩色日志：on / off / auto（auto 在终端输出时启用） |
| `--verbose / --log-verbose` | -v | - | - | 将详细级别设为无穷大（记录所有消息，用于调试） |
| `--offline` | - | - | LLAMA_OFFLINE | 离线模式：强制使用缓存，禁止网络访问 |
| `--verbosity / --log-verbosity` | -lv | 3 | LLAMA_LOG_VERBOSITY | 详细级别阈值：0=通用 / 1=错误 / 2=警告 / 3=信息 / 4=跟踪 / 5=调试 |
| `--log-prefix / --no-log-prefix` | - | - | LLAMA_ARG_LOG_PREFIX | 是否在日志消息中启用前缀 |
| `--log-timestamps / --no-log-timestamps` | - | - | LLAMA_ARG_LOG_TIMESTAMPS | 是否在日志消息中启用时间戳 |
| `--spec-draft-type-k / --cache-type-k-draft` | -ctkd | f16 | LLAMA_ARG_SPEC_DRAFT_CACHE_TYPE_K | 草稿模型 KV 缓存中 K 的数据类型 |
| `--spec-draft-type-v / --cache-type-v-draft` | -ctvd | f16 | LLAMA_ARG_SPEC_DRAFT_CACHE_TYPE_V | 草稿模型 KV 缓存中 V 的数据类型 |


## 采样参数

控制文本生成的随机性和质量——温度、Top-K、Top-P、重复惩罚、DRY 采样、Mirostat 等。

| 参数 | 简写 | 默认值 | 环境变量 | 说明 |
|------|------|--------|----------|------|
| `--samplers` | - | penalties;dry;top_n_sigma;top_k;typ_p;top_p;min_p;xtc;temperature | - | 生成时使用的采样器顺序（分号分隔） |
| `--seed` | -s | -1（随机） | - | 随机数生成器种子，-1 表示使用随机种子 |
| `--sampler-seq / --sampling-seq` | - | edskypmxt | - | 采样器简化序列 |
| `--ignore-eos` | - | - | - | 忽略流结束 token，继续生成（隐含 --logit-bias EOS-inf） |
| `--temperature` | --temp | 0.80 | - | 温度参数，控制输出随机性，越高越随机 |
| `--top-k` | - | 40（0=禁用） | LLAMA_ARG_TOP_K | Top-K 采样，仅从概率最高的 K 个 token 中采样 |
| `--top-p` | - | 0.95（1.0=禁用） | - | Top-P（核）采样，从累积概率达到 P 的最小 token 集合中采样 |
| `--min-p` | - | 0.05（0.0=禁用） | - | Min-P 采样，过滤掉概率低于最高概率 × min_p 的 token |
| `--top-n-sigma / --top-nsigma` | - | -1.00（-1.0=禁用） | - | Top-N-Sigma 采样，基于标准差过滤 |
| `--xtc-probability` | - | 0.00（0.0=禁用） | - | XTC 采样概率 |
| `--xtc-threshold` | - | 0.10（1.0=禁用） | - | XTC 采样阈值 |
| `--typical / --typical-p` | - | 1.00（1.0=禁用） | - | 局部典型采样，参数 p |
| `--repeat-last-n` | - | 64（0=禁用，-1=ctx_size） | - | 用于重复惩罚考虑的最后 N 个 token |
| `--repeat-penalty` | - | 1.00（1.0=禁用） | - | 重复 token 序列的惩罚系数 |
| `--presence-penalty` | - | 0.00（0.0=禁用） | - | 存在惩罚（alpha presence penalty） |
| `--frequency-penalty` | - | 0.00（0.0=禁用） | - | 频率惩罚（alpha frequency penalty） |
| `--dry-multiplier` | - | 0.00（0.0=禁用） | - | DRY 采样乘数 |
| `--dry-base` | - | 1.75 | - | DRY 采样基础值 |
| `--dry-allowed-length` | - | 2 | - | DRY 采样允许的长度 |
| `--dry-penalty-last-n` | - | -1（0=禁用，-1=上下文大小） | - | DRY 采样对最后 N 个 token 的惩罚 |
| `--dry-sequence-breaker` | - | '\n', ':', '"', '*' | - | DRY 采样的序列中断符（"none" 表示不使用任何中断符） |
| `--adaptive-target` | - | -1.00（负值=禁用） | - | Adaptive-P：选择接近此概率的 token（范围 0.0~1.0） |
| `--adaptive-decay` | - | 0.90 | - | Adaptive-P：目标适应的衰减率（范围 0.0~0.99，越低越敏感，越高越稳定） |
| `--dynatemp-range` | - | 0.00（0.0=禁用） | - | 动态温度范围 |
| `--dynatemp-exp` | - | 1.00 | - | 动态温度指数 |
| `--mirostat` | - | 0（0=禁用，1=Mirostat，2=Mirostat 2.0） | - | 使用 Mirostat 采样（启用后忽略 Top-K、Nucleus、Typical） |
| `--mirostat-lr` | - | 0.10 | - | Mirostat 学习率（参数 eta） |
| `--mirostat-ent` | - | 5.00 | - | Mirostat 目标熵（参数 tau） |
| `--logit-bias` | -l | - | - | 修改 token 出现概率（格式：TOKEN_ID(+/-)BIAS，如 15043+1） |
| `--grammar` | - | - | - | BNF 类语法约束生成 |
| `--grammar-file` | - | - | - | 从文件读取语法 |
| `--json-schema` | -j | - | - | JSON Schema 约束生成（如 {} 表示任意 JSON 对象） |
| `--json-schema-file` | -jf | - | - | 从文件读取 JSON Schema 约束生成 |
| `--backend-sampling` | -bs | 禁用 | LLAMA_ARG_BACKEND_SAMPLING | 启用后端采样（实验性） |


## 推测解码参数

使用草稿模型加速推理的技术，支持 ngram、Eagle3、MTP 等多种推测策略。

| 参数 | 简写 | 默认值 | 环境变量 | 说明 |
|------|------|--------|----------|------|
| `--spec-draft-hf / --hf-repo-draft` | -hfd, -hfrd | 未使用 | LLAMA_ARG_SPEC_DRAFT_HF_REPO | 草稿模型的 Hugging Face 仓库（同 --hf-repo 格式） |
| `--spec-draft-threads / --threads-draft` | -td | 同 --threads | - | 草稿模型生成时使用的线程数 |
| `--spec-draft-threads-batch / --threads-batch-draft` | -tbd | 同 --threads-draft | - | 草稿模型批处理时使用的线程数 |
| `--spec-draft-cpu-mask / --cpu-mask-draft` | -Cd | 同 --cpu-mask | - | 草稿模型 CPU 亲和性掩码 |
| `--spec-draft-cpu-range / --cpu-range-draft` | -Crd | - | - | 草稿模型 CPU 亲和性范围 |
| `--spec-draft-cpu-strict / --cpu-strict-draft` | - | 同 --cpu-strict | - | 草稿模型是否使用严格 CPU 放置 |
| `--spec-draft-prio / --prio-draft` | - | 0 | - | 草稿模型进程/线程优先级 |
| `--spec-draft-poll / --poll-draft` | - | 同 --poll | - | 草稿模型是否使用轮询等待 |
| `--spec-draft-cpu-mask-batch / --cpu-mask-batch-draft` | -Cbd | 同 --cpu-mask | - | 草稿模型批处理 CPU 亲和性掩码 |
| `--spec-draft-cpu-strict-batch / --cpu-strict-batch-draft` | - | 同 --cpu-strict-draft | - | 草稿模型批处理严格 CPU 放置 |
| `--spec-draft-prio-batch / --prio-batch-draft` | - | 0 | - | 草稿模型批处理优先级 |
| `--spec-draft-poll-batch / --poll-batch-draft` | - | 同 --poll-draft | - | 草稿模型批处理轮询 |
| `--spec-draft-override-tensor / --override-tensor-draft` | -otd | - | - | 覆盖草稿模型的张量缓冲区类型 |
| `--spec-draft-cpu-moe / --cpu-moe-draft` | -cmoed | - | LLAMA_ARG_SPEC_DRAFT_CPU_MOE | 草稿模型将所有 MoE 权重保留在 CPU |
| `--spec-draft-n-cpu-moe / --n-cpu-moe-draft` | -ncmoed | - | LLAMA_ARG_SPEC_DRAFT_N_CPU_MOE | 草稿模型将前 N 层 MoE 权重保留在 CPU |
| `--spec-draft-n-max` | - | 3 | LLAMA_ARG_SPEC_DRAFT_N_MAX | 推测解码每次草稿的 token 数 |
| `--spec-draft-n-min` | - | 0 | LLAMA_ARG_SPEC_DRAFT_N_MIN | 推测解码使用的最小草稿 token 数 |
| `--spec-draft-p-split / --draft-p-split` | - | 0.10 | LLAMA_ARG_SPEC_DRAFT_P_SPLIT | 推测解码分裂概率 |
| `--spec-draft-p-min / --draft-p-min` | - | 0.00 | LLAMA_ARG_SPEC_DRAFT_P_MIN | 推测解码最小概率（贪心） |
| `--spec-draft-device / --device-draft` | -devd | - | - | 草稿模型卸载设备列表 |
| `--spec-draft-ngl / --gpu-layers-draft / --n-gpu-layers-draft` | -ngld | auto | LLAMA_ARG_N_GPU_LAYERS_DRAFT | 草稿模型存储在 VRAM 中的最大层数 |
| `--spec-draft-model / --model-draft` | -md | 未使用 | LLAMA_ARG_SPEC_DRAFT_MODEL | 推测解码的草稿模型路径 |
| `--spec-type` | - | none | LLAMA_ARG_SPEC_TYPE | 推测解码类型（逗号分隔）：none / draft-simple / draft-eagle3 / draft-mtp / ngram-simple / ngram-map-k / ngram-map-k4v / ngram-mod / ngram-cache |
| `--spec-ngram-mod-n-min` | - | 48 | - | ngram-mod 推测解码的最小 ngram token 数 |
| `--spec-ngram-mod-n-max` | - | 64 | - | ngram-mod 推测解码的最大 ngram token 数 |
| `--spec-ngram-mod-n-match` | - | 24 | - | ngram-mod 查找长度 |
| `--spec-ngram-simple-size-n` | - | 12 | - | ngram-simple 查找 n-gram 长度 |
| `--spec-ngram-simple-size-m` | - | 48 | - | ngram-simple 草稿 m-gram 长度 |
| `--spec-ngram-simple-min-hits` | - | 1 | - | ngram-simple 最小命中次数 |
| `--spec-ngram-map-k-size-n` | - | 12 | - | ngram-map-k 查找 n-gram 长度 |
| `--spec-ngram-map-k-size-m` | - | 48 | - | ngram-map-k 草稿 m-gram 长度 |
| `--spec-ngram-map-k-min-hits` | - | 1 | - | ngram-map-k 最小命中次数 |
| `--spec-ngram-map-k4v-size-n` | - | 12 | - | ngram-map-k4v 查找 n-gram 长度 |
| `--spec-ngram-map-k4v-size-m` | - | 48 | - | ngram-map-k4v 草稿 m-gram 长度 |
| `--spec-ngram-map-k4v-min-hits` | - | 1 | - | ngram-map-k4v 最小命中次数 |
| `--draft / --draft-n / --draft-max` | - | - | LLAMA_ARG_DRAFT_MAX | 已移除，请使用 --spec-draft-n-max 或 --spec-ngram-mod-n-max |
| `--draft-min / --draft-n-min` | - | - | LLAMA_ARG_DRAFT_MIN | 已移除，请使用 --spec-draft-n-min 或 --spec-ngram-mod-n-min |
| `--spec-ngram-size-n` | - | - | - | 已移除，请使用对应的 --spec-ngram-*-size-n 或 --spec-ngram-mod-n-match |
| `--spec-ngram-size-m` | - | - | - | 已移除，请使用对应的 --spec-ngram-*-size-m |
| `--spec-ngram-min-hits` | - | - | - | 已移除，请使用对应的 --spec-ngram-*-min-hits |


## 服务器与示例参数

HTTP 服务器监听、多模态视觉、嵌入池化、KV 缓存、连续批处理等配置。

| 参数 | 简写 | 默认值 | 环境变量 | 说明 |
|------|------|--------|----------|------|
| `--lookup-cache-static` | -lcs | - | - | 静态查找缓存路径（生成时不更新） |
| `--lookup-cache-dynamic` | -lcd | - | - | 动态查找缓存路径（生成时更新） |
| `--ctx-checkpoints / --swa-checkpoints` | -ctxcp | 32 | LLAMA_ARG_CTX_CHECKPOINTS | 每个 slot 创建的最大上下文检查点数 |
| `--checkpoint-every-n-tokens` | -cpent | 8192（-1=禁用） | LLAMA_ARG_CHECKPOINT_EVERY_NT | prefill 期间每 N 个 token 创建一个检查点 |
| `--cache-ram` | -cram | 8192（-1=无限制，0=禁用） | LLAMA_ARG_CACHE_RAM | 最大缓存大小（MiB） |
| `--kv-unified / --no-kv-unified` | -kvu / -no-kvu | slot 数为 auto 时启用 | LLAMA_ARG_KV_UNIFIED | 使用所有序列共享的单一统一 KV 缓冲区 |
| `--cache-idle-slots / --no-cache-idle-slots` | - | 启用（需统一 KV 和 cache-ram） | LLAMA_ARG_CACHE_IDLE_SLOTS | 新任务时保存并清除空闲 slot |
| `--context-shift / --no-context-shift` | - | 禁用 | LLAMA_ARG_CONTEXT_SHIFT | 无限文本生成时是否使用上下文偏移 |
| `--reverse-prompt` | -r | - | - | 在 PROMPT 处停止生成，交互模式下返回控制 |
| `--special` | -sp | false | - | 启用特殊 token 输出 |
| `--warmup / --no-warmup` | - | 启用 | - | 是否执行空运行预热 |
| `--spm-infill` | - | 禁用 | - | 使用 Suffix/Prefix/Middle 模式进行填充（部分模型偏好此模式） |
| `--pooling` | - | 模型默认 | LLAMA_ARG_POOLING | 嵌入池化类型：none / mean / cls / last / rank |
| `--parallel` | -np | -1（auto） | LLAMA_ARG_N_PARALLEL | 服务器 slot 数量 |
| `--cont-batching / --no-cont-batching` | -cb / -nocb | 启用 | LLAMA_ARG_CONT_BATCHING | 是否启用连续批处理（动态批处理） |
| `--mmproj` | -mm | - | LLAMA_ARG_MMPROJ | 多模态投影器文件路径（使用 -hf 时可省略） |
| `--mmproj-url` | -mmu | - | LLAMA_ARG_MMPROJ_URL | 多模态投影器文件 URL |
| `--mmproj-auto / --no-mmproj / --no-mmproj-auto` | - | 启用 | LLAMA_ARG_MMPROJ_AUTO | 是否自动使用多模态投影器（配合 -hf 使用） |
| `--mmproj-offload / --no-mmproj-offload` | - | 启用 | LLAMA_ARG_MMPROJ_OFFLOAD | 是否启用多模态投影器的 GPU 卸载 |
| `--image-min-tokens` | - | 从模型读取 | LLAMA_ARG_IMAGE_MIN_TOKENS | 每张图片最少 token 数（仅动态分辨率视觉模型） |
| `--image-max-tokens` | - | 从模型读取 | LLAMA_ARG_IMAGE_MAX_TOKENS | 每张图片最多 token 数（仅动态分辨率视觉模型） |
| `--alias` | -a | - | LLAMA_ARG_ALIAS | 模型名称别名（逗号分隔，供 API 使用） |
| `--tags` | - | - | LLAMA_ARG_TAGS | 模型标签（逗号分隔，仅信息性，不用于路由） |
| `--embd-normalize` | - | 2 | - | 嵌入归一化方式：-1=无 / 0=最大绝对int16 / 1=曼哈顿 / 2=欧几里得 / >2=p-范数 |
| `--host` | - | 127.0.0.1 | LLAMA_ARG_HOST | 监听 IP 地址（以 .sock 结尾则绑定 UNIX socket） |
| `--port` | - | 8080 | LLAMA_ARG_PORT | 监听端口 |
| `--reuse-port` | - | 禁用 | LLAMA_ARG_REUSE_PORT | 允许多个 socket 绑定同一端口 |
| `--path` | - | 空 | LLAMA_ARG_STATIC_PATH | 静态文件服务路径 |
| `--api-prefix` | - | 空 | LLAMA_ARG_API_PREFIX | 服务器 API 前缀路径（不含尾部斜杠） |
| `--webui-config` | - | - | LLAMA_ARG_WEBUI_CONFIG | [已弃用] 请用 --ui-config。WebUI 默认设置 JSON |
| `--ui-config` | - | - | LLAMA_ARG_UI_CONFIG | UI 默认设置 JSON（覆盖 UI 默认值） |
| `--webui-config-file` | - | - | LLAMA_ARG_WEBUI_CONFIG_FILE | [已弃用] 请用 --ui-config-file。WebUI 设置 JSON 文件 |
| `--ui-config-file` | - | - | LLAMA_ARG_UI_CONFIG_FILE | UI 设置 JSON 文件路径 |
| `--webui-mcp-proxy / --no-webui-mcp-proxy` | - | - | LLAMA_ARG_WEBUI_MCP_PROXY | [已弃用] 请用 --ui-mcp-proxy |
| `--ui-mcp-proxy / --no-ui-mcp-proxy` | - | 禁用 | LLAMA_ARG_UI_MCP_PROXY | 实验性：是否启用 MCP CORS 代理（勿在不受信任环境中启用） |
| `--tools` | - | 无工具 | LLAMA_ARG_TOOLS | 实验性：启用 AI Agent 内置工具（"all"=全部）。可用：read_file, file_glob_search, grep_search, exec_shell_command, write_file, edit_file, apply_diff, get_datetime |
| `--webui / --no-webui` | - | - | LLAMA_ARG_WEBUI | [已弃用] 请用 --ui/--no-ui |
| `--ui / --no-ui` | - | 启用 | LLAMA_ARG_UI | 是否启用 Web UI |
| `--embedding / --embeddings` | - | 禁用 | LLAMA_ARG_EMBEDDINGS | 仅支持嵌入用例（仅用于专用嵌入模型） |
| `--rerank / --reranking` | - | 禁用 | LLAMA_ARG_RERANKING | 启用服务器上的重排序端点 |
| `--api-key` | - | 无 | LLAMA_API_KEY | API 认证密钥（逗号分隔可设多个） |
| `--api-key-file` | - | 无 | - | 包含 API 密钥的文件路径 |
| `--ssl-key-file` | - | - | LLAMA_ARG_SSL_KEY_FILE | PEM 编码 SSL 私钥文件路径 |
| `--ssl-cert-file` | - | - | LLAMA_ARG_SSL_CERT_FILE | PEM 编码 SSL 证书文件路径 |
| `--chat-template-kwargs` | - | - | LLAMA_CHAT_TEMPLATE_KWARGS | JSON 模板解析器的额外参数（有效 JSON 对象字符串） |
| `--timeout` | -to | 600 | LLAMA_ARG_TIMEOUT | 服务器读写超时（秒） |
| `--threads-http` | - | -1 | LLAMA_ARG_THREADS_HTTP | 处理 HTTP 请求的线程数 |
| `--cache-prompt / --no-cache-prompt` | - | 启用 | LLAMA_ARG_CACHE_PROMPT | 是否启用 prompt 缓存 |
| `--cache-reuse` | - | 0 | LLAMA_ARG_CACHE_REUSE | 通过 KV 偏移尝试从缓存复用的最小块大小（需启用 prompt 缓存） |
| `--metrics` | - | 禁用 | LLAMA_ARG_ENDPOINT_METRICS | 启用 Prometheus 兼容的指标端点 |
| `--props` | - | 禁用 | LLAMA_ARG_ENDPOINT_PROPS | 允许通过 POST /props 修改全局属性 |
| `--slots / --no-slots` | - | 启用 | LLAMA_ARG_ENDPOINT_SLOTS | 暴露 slot 监控端点 |
| `--slot-save-path` | - | 禁用 | - | slot KV 缓存保存路径 |
| `--media-path` | - | 禁用 | - | 本地媒体文件加载目录（可通过 file:// URL 相对路径访问） |
| `--models-dir` | - | 禁用 | LLAMA_ARG_MODELS_DIR | 路由器服务器的模型目录 |
| `--models-preset` | - | 禁用 | LLAMA_ARG_MODELS_PRESET | 路由器服务器模型预设 INI 文件路径 |
| `--models-max` | - | 4（0=无限制） | LLAMA_ARG_MODELS_MAX | 路由器服务器同时加载的最大模型数 |
| `--models-autoload / --no-models-autoload` | - | 启用 | LLAMA_ARG_MODELS_AUTOLOAD | 路由器服务器是否自动加载模型 |
| `--jinja / --no-jinja` | - | 启用 | LLAMA_ARG_JINJA | 是否使用 Jinja 模板引擎处理聊天 |
| `--reasoning-format` | - | auto | LLAMA_ARG_THINK | 思维标签处理格式：none（不解析）/ deepseek（放入 reasoning_content）/ deepseek-legacy（保留 \<think\> 标签同时填充 reasoning_content） |
| `--reasoning` | -rea | auto | LLAMA_ARG_REASONING | 聊天中是否使用推理/思考：on / off / auto（从模板检测） |
| `--reasoning-budget` | - | -1 | LLAMA_ARG_THINK_BUDGET | 思考 token 预算：-1=无限制 / 0=立即结束 / N>0=token 预算 |
| `--reasoning-budget-message` | - | 无 | LLAMA_ARG_THINK_BUDGET_MESSAGE | 推理预算耗尽时注入到思考结束标签前的消息 |
| `--chat-template` | - | 模型元数据模板 | LLAMA_ARG_CHAT_TEMPLATE | 自定义 Jinja 聊天模板（内置模板包括：chatml, llama3, deepseek3, gemma, phi4, qwen 等数十种） |
| `--chat-template-file` | - | 模型元数据模板 | LLAMA_ARG_CHAT_TEMPLATE_FILE | 自定义 Jinja 聊天模板文件路径 |
| `--skip-chat-parsing / --no-skip-chat-parsing` | - | 禁用 | LLAMA_ARG_SKIP_CHAT_PARSING | 强制纯内容解析器（即使指定了 Jinja 模板，所有输出包括推理和工具调用都放在 content 中） |
| `--prefill-assistant / --no-prefill-assistant` | - | 启用 | LLAMA_ARG_PREFILL_ASSISTANT | 最后一条消息为 assistant 时是否预填充其回复 |
| `--slot-prompt-similarity` | -sps | 0.10（0.0=禁用） | - | 请求 prompt 与 slot prompt 的匹配相似度阈值 |
| `--lora-init-without-apply` | - | 禁用 | - | 加载 LoRA 适配器但不应用（后续通过 POST /lora-adapters 应用） |
| `--sleep-idle-seconds` | - | -1（禁用） | - | 空闲多少秒后服务器进入睡眠 |
| `--model-vocoder` | -mv | 未使用 | - | 音频生成的声码器模型路径 |
| `--tts-use-guide-tokens` | - | - | - | 使用引导 token 提高 TTS 单词召回率 |
| `--embd-gemma-default` | - | - | - | 使用默认 EmbeddingGemma 模型（可能从网络下载权重） |
| `--fim-qwen-1.5b-default` | - | - | - | 使用默认 Qwen 2.5 Coder 1.5B（可能从网络下载） |
| `--fim-qwen-3b-default` | - | - | - | 使用默认 Qwen 2.5 Coder 3B（可能从网络下载） |
| `--fim-qwen-7b-default` | - | - | - | 使用默认 Qwen 2.5 Coder 7B（可能从网络下载） |
| `--fim-qwen-7b-spec` | - | - | - | 使用 Qwen 2.5 Coder 7B + 0.5B 草稿模型进行推测解码 |
| `--fim-qwen-14b-spec` | - | - | - | 使用 Qwen 2.5 Coder 14B + 0.5B 草稿模型进行推测解码 |
| `--fim-qwen-30b-default` | - | - | - | 使用默认 Qwen 3 Coder 30B A3B Instruct（可能从网络下载） |
| `--gpt-oss-20b-default` | - | - | - | 使用 gpt-oss-20b（可能从网络下载） |
| `--gpt-oss-120b-default` | - | - | - | 使用 gpt-oss-120b（可能从网络下载） |
| `--vision-gemma-4b-default` | - | - | - | 使用 Gemma 3 4B QAT（可能从网络下载） |
| `--vision-gemma-12b-default` | - | - | - | 使用 Gemma 3 12B QAT（可能从网络下载） |
