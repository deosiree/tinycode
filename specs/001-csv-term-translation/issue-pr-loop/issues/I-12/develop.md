# Develop Plan：I-12 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T048,T049。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-07。
- Issue/PR：未创建；前置：I-01 与 I-25 合并。

## 背景、范围与契约

- 背景：高频未知词应作为独立候选资料供人工处理，不能反向修改原参考工作簿。
- 包含：按词项及相同 comment 聚合；阈值 3；生成固定命名的独立增量 XLSX，含术语、候选英文、描述和场景。
- 不包含：翻译 workflow 接入、正式记忆 Add 或原文件更新。
- 输入：未知候选和出现次数；输出：独立 XLSX 文件。
- 环境：ExcelJS、fixture 与临时目录；无 API。
- 文件边界：`src/term-translation/glossary-delta.ts`、`tests/term-translation/glossary-delta.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 统计键按词项及相同 comment 区分 | grouping tests |
| N-02 | 达到 3 次才纳入；输出结构符合参考工作簿适用格式 | 2/3 threshold fixture |
| N-03 | 固定目标重复生成可更新；源 workbook 字节/内容保持不变 | idempotence/read-only tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 次数 2 与 3 | 仅 3 次候选进入增量表 |
| T-02 | 输出路径已存在 | 更新固定路径，不创建重复副本 |
| T-03 | 生成过程失败 | 原参考工作簿保持未修改 |

- 交付：增量 XLSX 生成器、专属测试和字段映射说明。
- 验收 G-07 生成器子条件；workflow 集成由 I-19 负责。

## 记录

- 验证/审查/合并 SHA：pending。
- 任务重排：将原 `glossary.test.ts` 增量测试移到独立测试文件，避免与 I-02 冲突。
