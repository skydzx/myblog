---
title: WebShell 检测机器学习项目笔记
date: 2026-08-04
tags: [机器学习, WebShell, 检测, sklearn, 交叉验证, StratifiedKFold, 模型评估]
summary: WebShell 检测机器学习项目笔记：predict_file 预测脚本、交叉验证（StratifiedKFold）、模型评估指标、sklearn 用法。
---

> 个人 WebShell 检测 ML 项目笔记整理。涵盖数据划分、交叉验证、模型训练与预测的完整流程。

## 1. 数据划分：train_test_split

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # 测试集占20%
    random_state=42,      # 随机种子，结果可复现
    stratify=y            # 保持类别平衡（重要！）
)
```

`stratify=y` 确保训练/测试集中 webshell 与正常的比例与原始一致，避免测试集全是某一类导致评估失真。

## 2. 交叉验证：cross_val_score + StratifiedKFold

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model_temp, X_train, y_train, cv=cv, scoring='f1')
```

```text
K折交叉验证：
折1: 训练[2-10], 验证[1] → 得分1
折2: 训练[1,3-10], 验证[2] → 得分2
...共K折，最终得分 = 平均

shuffle=True：划分前打乱数据
random_state=42：固定种子，每次运行结果一致（可复现）
StratifiedKFold：每折保持类别比例（优于普通 KFold）
```

### 为什么 ±2 倍标准差？

```text
交叉验证得分近似正态分布：
- 均值 ± 1σ 覆盖约 68% 数据
- 均值 ± 2σ 覆盖约 95% 数据（常用，平衡准确与实用）
- 均值 ± 3σ 覆盖约 99.7%

模型稳定（std 小）→ 范围窄，可信
模型不稳（std 大）→ 范围宽，需改进/防过拟合
```

## 3. 特征标准化

```python
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # 训练集：计算并转换
X_test_scaled = scaler.transform(X_test)        # 测试集：用训练集统计量
```

公式：`z = (x - μ) / σ`。SVM/逻辑回归对特征尺度敏感，必须标准化。**测试集不能用自己算的均值/方差**。

## 4. 模型选择

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
```

| 模型 | 参数 | 特点 |
|------|------|------|
| RandomForestClassifier | n_estimators=100, max_depth=20, n_jobs=-1 | 并行、抗过拟合 |
| GradientBoostingClassifier | n_estimators=100, max_depth=5, learning_rate=0.1, subsample=0.8 | 串行、准确率高 |
| LogisticRegression | max_iter=1000 | 快、可解释 |
| LinearSVC | max_iter=2000, dual=False, C=1.0 | 大数据集快 |

## 5. 评估指标

```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
```

```text
准确率  (TP+TN)/(TP+TN+FP+FN)   正确预测比例
精确率  TP/(TP+FP)              预测为 webshell 中真正是 webshell 的比例（降误报）
召回率  TP/(TP+FN)              真正 webshell 中被识别出的比例（降漏报）
F1      2*P*R/(P+R)             精确率与召回率调和平均
AUC     ROC 曲线下面积           整体分类能力
混淆矩阵 TN/FP/FN/TP             分类结果明细
```

## 6. predict_file.py 预测流程

```text
1. 加载特征名称（metadata.json 的 feature_names，排除 label/file_path/language）
2. 加载模型（joblib 优先，numpy 兼容更好；pickle 兜底）
3. 预测文件：
   a. 读取文件（UTF-8，失败则字节方式）
   b. 特征提取（MultiLanguageFeatureExtractor.extract_features）
   c. 对齐特征向量（缺失填充 0）
   d. 转为 DataFrame（字段为特征名）
   e. 类型转换：pd.to_numeric（字符串→0）
   f. errors='coerce'：无法转换设为 NaN
   g. fillna(0) + replace([inf,-inf], 0)
   h. model.predict() 取 [0]；predict_proba() 取概率
4. 返回：文件路径、语言、prediction（webshell/normal）、概率
```

### 常见错误：could not convert string to float: 'none'

```text
原因：特征提取返回字符串 'none'（如 image_type），进入 DataFrame → 模型报错
修复：先 to_numeric 失败置 0 → 再 coerce 设 NaN → fillna(0) → 替换 inf
```

## 7. 批量预测

```python
# 目录收集（递归）
def collect_files_from_dir(directory, recursive):
    if recursive: return [f for f in directory.rglob('*') if f.is_file()]
    return [f for f in directory.iterdir() if f.is_file()]

# 文件列表收集（每行一个路径，# 注释，空行忽略）
def collect_files_from_list(file_list_path):
    with open(file_list_path, encoding='utf-8') as f:
        paths = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return [Path(p) for p in paths if Path(p).is_file()]

# 进度显示
for i, file in enumerate(files, 1):
    print(f"[{i}/{len(files)}] {file}")
```

---

> **一句话总结**：WebShell ML 项目 = 平衡切分（stratify）+ K 折交叉验证（StratifiedKFold）+ 标准化 + 多模型对比（LightGBM 最优 97%）。预测时特征顺序/类型必须与训练完全一致，字符串/缺失值要转数值。
