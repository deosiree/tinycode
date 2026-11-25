# Develop Plan：I-03 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T007,T012。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01,G-02,G-08。
- Issue/PR：未创建；前置：I-01、I-25。Q-01 的平台存储选择已记录；本 Issue 仍只验证 adapter，不承担部署持久化验收。

## 背景、范围与契约

- 背景：业务服务需复用 Mem0 OSS add/search，并把向量数据限制在本机 Qdrant。
- 包含：Mem0/Qdrant 客户端初始化与 add/search 适配；项目 ID/collection、metadata、telemetry 和错误边界。
- 不包含：工作簿解析、来源 active-version 策略、Add/Search 工作流和远程服务。
- 输入：结构化记忆片段、项目标识、获批本机 endpoint；输出：适配后的结果/明确错误。
- 环境：mock Mem0/Qdrant client；不启动真实服务。服务 endpoint 固定为 loopback `http://127.0.0.1:6333`，持久化方式由 I-21/I-22 验收。
- 文件边界：`src/term-translation/mem0-adapter.ts`、`tests/term-translation/mem0-adapter.test.ts`。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 设置关闭 Mem0 telemetry 的初始化边界；使用原文模式，不调用提取 LLM | adapter mock |
| N-02 | 传递稳定项目标识及 collection/metadata filter，结果保留相似度和来源字段 | mock client assertions |
| N-03 | add/search 错误原样形成可处理失败；不访问非 loopback endpoint | 故障与 endpoint 测试 |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | add/search 指定项目 | client 参数和项目隔离键准确 |
| T-02 | Qdrant 不可用或 filter/query 报错 | 返回失败，不返回伪造空成功结果 |
| T-03 | 初始化 telemetry | 不产生未声明 telemetry 请求 |

- 交付：adapter、mock 测试、经核验的依赖/API 版本记录。
- 验收 G-01/G-02/G-08 的 adapter 子条件；来源版本过滤由 I-14 实现。

## 记录

- 验证/审查/合并 SHA：pending。
- 风险：adapter mock 通过不能作为真实 Qdrant 持久化或任何操作系统部署已验收的证据。
- 下一节点：I-13、I-14 分别依赖本 Issue；须等待本 PR 人工验收和合并。
