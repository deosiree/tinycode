# Develop Plan：I-26 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T026,T052。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-01,G-03,G-04,G-05,G-06,G-07,G-08,G-09。
- Issue/PR：未创建；前置：I-20 人工验收合并。

## 背景、范围与契约

- 背景：模块单测不能证明 TinyCode Agent 注册入口能按用户流程连接 Add、Search、翻译、审核和增量输出。
- 包含：使用模型、Embedding、Mem0/Qdrant adapter mock，通过真实 TinyCode harness 验证 Add/Search 调用顺序、翻译、失败门禁、HITL 和增量结果。
- 不包含：真实外部模型调用、Qdrant 持久化/重启验证、全仓 CI 门禁或修改功能实现。
- 输入：已注册的 TinyCode workflow 和隔离 fixture；输出：可复现的 Agent workflow E2E。
- 环境：CI Node 22/24；模型、Embedding、Mem0/Qdrant 均用确定性 mock，不访问外网。
- 文件边界：`tests/harness.e2e.test.ts`、`tests/fixtures/term-translation/**`；功能偏差回到对应 owner Issue。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 用户提交参考资料后调用 Add，再对每条翻译和 judge 先 Search 后调用模型 | harness trace assertions |
| N-02 | Search/授权失败时模型调用为零，任务保留未完成状态 | fail-closed E2E |
| N-03 | 冲突组在人工批准前不写为已批准；决定应用后只更新关联行 | HITL E2E |
| N-04 | 高频未知词进入独立增量输出，原参考工作簿和输入 CSV 不变 | fixture assertions |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | 正常 Add 后执行翻译和 judge | 每个模型调用前都有当前词条 Search 轨迹 |
| T-02 | Search 或 query 授权失败 | 不调用模型，不静默回退读取工作簿 |
| T-03 | 存在歧义冲突 | 未经用户决定的候选不标记为最终批准 |
| T-04 | 批次达到未知词门槛 | 生成独立 delta，不改输入/参考文件 |

- 交付：Agent harness E2E、脱敏 fixture 和执行证据。
- 验收 G-01/G-03/G-04/G-05/G-06/G-07/G-08/G-09 的工作流子条件；真实本机存储由 I-21 验证。

## 记录

- 验证/审查/合并 SHA：pending。
- 任何 E2E 发现的产品缺陷回到责任 Issue；本 Issue 只维护 harness 和 fixture。
