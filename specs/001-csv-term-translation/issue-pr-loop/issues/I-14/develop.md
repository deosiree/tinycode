# Develop Plan：I-14 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T015。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-02,G-03,G-08。
- Issue/PR：未创建；前置：I-03 与 I-04 人工验收合并。

## 背景、范围与契约

- 背景：翻译和 judge 必须使用当前项目、当前 active 来源版本的相关参考片段。
- 包含：以项目身份和来源清单 active-version 约束 Mem0 search；限制 top-5；返回文本、来源定位和相似度。
- 不包含：Search query 外发授权 UI（I-10）、模型调用、Add、版本状态修改。
- 输入：当前词项与必要 comment/场景、项目 key；输出：最多 5 条有定位的记忆命中或失败。
- 环境：loopback Qdrant fixture 与确定性 embedding/mock；无真实网络。
- 文件边界：`src/term-translation/memory-search.ts`、`tests/term-translation/memory-search.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | Search 限定当前项目且只接受 active-version 条目 | project/version filter tests |
| N-02 | 返回最多 5 条并带 source/sheet/row/similarity | result shape assertions |
| N-03 | 数据库/检索失败返回失败，不回退读取整本工作簿 | fail-closed tests |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 命中多于 5 条 | 返回至多 5 条并保留来源定位 |
| T-02 | active manifest 为空或数据库故障 | 不伪造成功；调用方收到停止信号 |
| T-03 | 两个项目使用相同 query | 无跨项目结果 |

- 交付：Search service、集成测试和 Search 结果来源契约。
- 验收 G-02/G-03/G-08 Search 子条件；翻译/judge 前置调用由 I-16 保证。

## 记录

- 验证/审查/合并 SHA：pending。
- 任务重排：将 Search 从现有 `memory.ts` 拆至独占 `memory-search.ts`。
