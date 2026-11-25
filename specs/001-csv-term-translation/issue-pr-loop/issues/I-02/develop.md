# Develop Plan：I-02 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T006,T011。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01。
- Issue/PR：未创建；前置：I-01 与 I-25 合并；独占路径见下。

## 背景、范围与契约

- 背景：内置及用户提交的参考工作簿需要转换成可索引、可追溯的术语片段。
- 包含：解析四个指定 sheet，映射术语、comment、场景、伪代码属性/备注并记录来源 sheet/row；输入只读。
- 不包含：Embedding、向量写入、版本切换、增量工作簿生成。
- 输入：受支持 XLSX；输出：符合共享类型的片段列表或定位明确的解析错误。
- 环境：ExcelJS 与确定性 XLSX fixture；Node.js 22.19+。
- 文件边界：`src/term-translation/glossary.ts`、`tests/term-translation/glossary-parse.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 映射四个指定工作表的不同结构，保留 sheet/row | fixture 单测 |
| N-02 | 缺 sheet、空行及缺失必要字段返回可定位错误 | 边界 fixture |
| N-03 | 不修改输入工作簿；输出片段符合 I-01 类型 | 只读断言、typecheck |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 完整参考工作簿 | 术语及规则片段与字段映射一致，来源位置准确 |
| T-02 | 缺少任一必需 sheet | 导入可报告具体 sheet，不返回成功的部分目录 |

- 交付：parser、fixture 测试、映射说明和验证证据。
- 验收 G-01 的“输入可转换为来源片段”子条件；不声明记忆已持久化。

## 记录

- 验证/审查/合并 SHA：pending。
- 路径冲突检查：通过任务重排将原共享 `glossary.test.ts` 的解析用例移至专属测试文件。
- 下一节点：I-13 Add 服务在 I-03/I-04 也合并后解锁。
