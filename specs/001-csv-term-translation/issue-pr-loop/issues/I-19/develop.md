# Develop Plan：I-19 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T050。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-07。
- Issue/PR：未创建；前置：I-12、I-17 人工验收合并。

## 背景、范围与契约

- 背景：独立生成器可在给定未知候选时输出 XLSX；批次翻译需把本次未知词统计及候选传入该生成器。
- 包含：从批次结果按词项/comment 形成未知词摘要；对接 I-12 输出固定增量文件；维持 CSV 完成与增量资料待审状态分离。
- 不包含：工作簿解析器、Add 至长期记忆、直接更改 CSV 完成规则或原工作簿。
- 输入：批次结果及匹配状态；输出：增量文件结果与独立的审核状态。
- 环境：I-12 生成器 mock/fixture 和 CSV workflow 临时目录。
- 文件边界：`src/term-translation/delta-workflow.ts`、`tests/term-translation/delta-workflow.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 只统计未匹配的词项与相同 comment；仅达阈值项提交生成器 | aggregate tests |
| N-02 | 增量资料待审不阻止 CSV 的既有完成判断 | independent-state tests |
| N-03 | 生成失败按增量状态报告，不破坏已落盘 CSV | injected failure test |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 已成功翻译但 delta generator 失败 | CSV 状态按 CSV 审核结果计算；增量状态另报失败 |
| T-02 | 未知词达到门槛 | 使用 I-12 固定输出且不改输入参考文件 |

- 交付：delta workflow adapter、状态隔离测试。
- 验收 G-07；生成格式由 I-12 所有，本 Issue 不共改其文件。

## 记录

- 验证/审查/合并 SHA：pending。
- 下一节点：I-20 注册工作流入口。
