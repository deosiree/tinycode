# 项目 Goal：TinyCode CSV 词条英文翻译与术语消歧

## 锚点元数据

- `goalId`: `tinycode-csv-term-translation`
- `baselineVersion`: `draft-7`
- `status`: `deferred`
- `confirmedAt`: `pending`
- `confirmedBy`: `pending user review`
- `repository`: `deosiree/tinycode`（fork；上游为 `helsome/tinycode`）
- `documentRoot`: `specs/001-csv-term-translation/issue-pr-loop/`
- `lastReviewedAt`: `2026-11-25`
- `sourceSpec`: `../spec.md`（Draft，尚未据此推定 Plan 获批）

## 初始目标

让 TinyCode 用户能把 CSV 中的新词条翻译为英文，在每次翻译和 LLM judge 前检索按项目隔离的本地参考记忆，并将有歧义的候选交给用户审核。通过有依赖的 GitHub Issue、逐项隔离开发、PR 人工验收和最终集成验证完成交付。

本文件是项目级目标草稿，不代表产品规格、技术 Plan 或 Issue 拆分已获批准。每个 Issue 发布前须经用户审阅并明确批准。

用户已决定暂缓执行本 Goal，当前学习主线转为 TinyCode 通用 Agent Harness。CSV 翻译功能保留为未来实战真实业务场景二开时的候选项目；恢复前须重新审阅规格、Goal、Issue 图、候选计划、仓库状态和授权，不自动开始实现或创建功能 Issue。

## 用户场景

| ID | 用户/角色 | 触发场景 | 期望结果 | 证据 |
| --- | --- | --- | --- | --- |
| U-01 | TinyCode 用户 | 提交参考工作簿后翻译 CSV | 新资料进入本机项目记忆；每次翻译和 judge 均先检索相关资料 | Add/Search 集成测试及调用轨迹 |
| U-02 | TinyCode 用户 | 参考规则更新后效果不佳 | 软删除新来源或恢复指定历史版本，后续检索只使用有效版本 | 生命周期集成测试及重启后检索 |
| U-03 | TinyCode 用户 | 运行英文翻译 | 获得保留原列和行的输出 CSV；失败或待审核状态明确 | CSV/工作流测试及固定评测样例 |
| U-04 | TinyCode 用户 | 看到冲突或歧义 | 按冲突组查看证据并明确批准后才回写 | HITL 工作流测试与审核记录 |
| U-05 | TinyCode 用户 | 多批 CSV 中有高频未知词 | 获得独立增量参考工作簿，原始工作簿保持不变 | 增量生成测试 |

## 范围

### 本次包含

- 使用 Mem0 OSS 和本机 Qdrant 实现按项目隔离的参考记忆 add/search。
- 参考资料来源指纹、幂等更新、版本保留、软删除和指定旧版本恢复。
- CSV 解析/输出、术语匹配、翻译、LLM judge、批次恢复、冲突 HITL 与高频未知词增量。
- TinyCode AgentTool、TUI/CLI 外发授权边界、项目 skill、文档、自动化与受控评测。
- 按 GitHub Issue 依赖图分解；独立模块在契约冻结后以隔离 worktree 并行实现，依赖项按顺序集成。

### 非目标

- 托管向量服务、账号系统、通用 Agent memory 框架或通用 Agent runtime 改造。
- 将待翻译 CSV 或未经用户审核的机器译文自动写入长期记忆。
- 自动批准翻译冲突、自动判定实体同一性或修改原始参考工作簿。
- 将用户额外导入的记忆同步到其他机器。
- 未获用户明确授权的真实模型评测、费用支出、PR 批准或合并。

## 约束与已确认决策

| ID | 决策/约束 | 来源 | 状态 |
| --- | --- | --- | --- |
| D-01 | 参考记忆使用 Mem0 OSS 和本机 Qdrant，并按项目隔离 | 用户确认 | `confirmed` |
| D-02 | Add 与 Search 是不同工作流；每次翻译和 LLM judge 前须 Search，Search 失败则停止对应模型调用 | 用户确认及 `../spec.md` | `confirmed` |
| D-03 | 来源版本保留；支持软删除和恢复旧版本，恢复不重新调用 Embedding | 用户确认及 `../spec.md` | `confirmed` |
| D-04 | 保留外发授权、telemetry 关闭和本机数据边界；不引入托管向量服务或账号系统 | 用户确认及 `../plan.md` | `confirmed` |
| D-05 | 每批最多 1000 条；翻译和 judge 共用最多 10 路并发；每个上游 LLM endpoint 同时最多一个请求 | 用户确认 | `confirmed` |
| D-06 | Issue 只发到用户 fork `deosiree/tinycode`；任何 Issue 草案先经用户批准 | 用户确认/本次流程 | `confirmed` |
| D-07 | Issue PR 依赖顺序合入 `feature/csv-term-translation`；最后再向仓库默认分支提交集成 PR，具体 base 发布前读回确认 | 用户先前 Goal；当前仓库策略 | `pending remote recheck` |
| D-08 | 开发期并行工作必须有冻结接口、互斥路径和隔离 worktree；单轮最多 3 个 Agent | 用户要求及 `issue-pr-loop` | `confirmed` |
| D-09 | Windows 上 Qdrant 数据使用 Docker named volume（暂定名 `tinycode-csv-term-translation-qdrant`）；来源清单仍位于 TinyCode `dataHome()`，备份与恢复须将两者作为一致数据集处理。macOS/Linux 的 `dataHome()` 挂载仍须实测后才能声明支持 | 用户选择方案 A | `confirmed; platform evidence pending` |
| D-10 | 暂缓 CSV 翻译业务目标；当前以通用 Agent Harness 学习为主线。仅在用户以后明确开始真实业务场景二开时重新审阅并决定是否恢复 | 用户本轮决定 | `confirmed; deferred` |

## 已解决的澄清

| ID | 用户决策 | 影响与跟进 | 状态 |
| --- | --- | --- | --- |
| Q-01 | 采用方案 A：Windows Qdrant 使用 Docker named volume；来源清单保留在 `dataHome()`。卷名暂定为 `tinycode-csv-term-translation-qdrant` | 两处数据分开存储；应用与 Qdrant 停止写入后成对备份/恢复。删除 named volume 会丢失向量数据。I-21/I-22 验证 Windows 重启与配对备份恢复；macOS/Linux `dataHome()` 挂载仍需各自验证 | `resolved_by_user` |
| Q-03 | 用户授权在 fork `deosiree/tinycode` 开启 Issues；实时读回时 `hasIssuesEnabled=true`，因此无需修改仓库设置 | 只允许在 fork 操作；每条 Issue 仍须先由用户审阅批准后才能创建。当前远端 Issue 列表为空，PR #1 已合并到 `main` | `resolved_by_user; remote_verified` |
| Q-02 | 用户确认 I-24 使用 OpenAI `gpt-5.6-luna` 与讯飞星火 Embedding `xop3qwen8bembedding`（OpenAI-compatible，Base URL `https://maas-api.cn-huabei-1.xf-yun.com/v2`），LLM 与 Embedding 合计费用上限 `USD 5.00` | I-24 真实评测仅限脱敏 fixture；一条合成文本 smoke test 返回 HTTP 200、768 维和 13 input tokens。用户提供该 Embedding 接口限时免费信息，优惠截止 `2026-12-31 02:00`（时区未注明），因此本次 smoke test 按优惠期内免费计入；公开资料未能独立核实该调用名对应的优惠细则。API 响应未提供货币金额。完整 I-24 评测仍未运行 | `resolved_by_user; promotion details user-reported; embedding smoke test passed; full evaluation pending` |

## 假设与待澄清

Goal 当前处于 `deferred`，I-01 至 I-26 均为未批准候选计划，不开始实现。以后恢复时重新核实仓库和远端状态、Q-02 授权及费用、I-24 评测条件，以及产品 Embedding 基线；不得把本地草稿视为获批设计。

## 全局验收标准

| ID | 验收条件 | 通过证据 | 验证环境/命令 | 类型 |
| --- | --- | --- | --- | --- |
| G-01 | 用户明确提交的受支持参考工作簿可幂等 Add 到本机项目记忆，且未授权时不外发 | Add 授权与幂等集成测试；调用记录 | mock Embedding + 隔离 loopback Qdrant | `functional/privacy` |
| G-02 | 来源版本更新、软删除和恢复行为一致；恢复后仅选定版本可 Search，且不重新 Embedding | 更新/删除/恢复/重启后 Search 测试 | 隔离持久化 Qdrant | `functional/data-integrity` |
| G-03 | 每条翻译和 LLM judge 请求前均有本地 Search 证据；失败时不调用对应模型 | 工作流测试及 trace assertion | 模型、Embedding mock | `functional/safety` |
| G-04 | 翻译输出保留输入记录及非目标列，按固定路径可重跑，批次失败可恢复 | CSV 往返、幂等和断点测试 | fixture + 临时目录 | `functional/data-integrity` |
| G-05 | 批次最多 1000 条；翻译和 judge 总并发最多 10；单上游 endpoint 最多 1 个并发请求 | scheduler concurrency tests | deterministic mock | `functional/performance-boundary` |
| G-06 | 占位符、质量门禁、语义冲突和需审核项按规则处理，未经 HITL 批准不标记为已批准 | 规则、0.7 边界、审核状态和过期决定测试 | fixture + mock | `functional/quality` |
| G-07 | 达到门槛的未知词进入独立增量工作簿，原参考工作簿不变 | 2/3 次边界与只读断言 | 临时工作簿 fixture | `functional` |
| G-08 | 不同项目的记忆互不混用，telemetry 关闭，模型只收到当前词条与最多 5 条相关检索结果 | 隔离、网络边界和 prompt 输入测试 | loopback Qdrant；外部 API mock | `privacy` |
| G-09 | 产品入口、文档和实现一致；所有 Issue PR 经人工验收合并，最终集成 PR、CI 和交付报告均可核验 | E2E、文档核对、GitHub 实时状态、合并 SHA 和验证记录 | Fork CI + 本地检查 | `delivery` |

### 性能目标

此功能已有用户指定的批次和并发边界（D-05）。目前没有端到端延迟或吞吐阈值，不自行补设；若实现需要性能基准，先作为待确认项提出。不得未授权对生产或外部服务压测。

### 安全验证范围

- 目标：本机 TinyCode 进程、loopback Qdrant 和 mock 外部服务。
- 允许：离线测试、隔离临时数据、授权范围内的配置与数据边界检查。
- 禁止：未经批准访问托管向量服务、发送真实用户 CSV、向上游仓库写 Issue，或在生产服务上进行破坏性测试。
- 真实调用及任何费用：仅可使用 Q-02 已确认模型，并将 LLM 与 Embedding 合计控制在 `USD 5.00` 内；ChatGPT Free 访问不代替 API 计费和认证。用户提供讯飞 Embedding 接口限时免费至 `2026-12-31 02:00`（时区未注明）；本次 13 input tokens 的合成 smoke test 按优惠期内免费计入。公开资料未能独立核实该调用名对应的优惠细则；API 响应未返回金额，不能据响应独立核实扣费。完整 I-24 评测仍须确认优惠适用范围/有效状态，并核对 LLM 及总费用；优惠失效或费用无法控制在上限内时停止调用。不得把单次 endpoint smoke test 视为 I-24 完成。

## 风险

| 风险 | 概率/影响 | 缓解措施 | 责任人 |
| --- | --- | --- | --- |
| Windows 向量库与来源清单分处 Docker volume 和 `dataHome()`，单独恢复可能造成版本指针与向量不一致 | 中/高 | 停止写入后按同一时间点成对备份/恢复，并在 I-21/I-22 留存验证证据 | I-21/I-22 |
| 过度拆分造成大量小 PR | 中/中 | 每个 Issue 必须有可独立验收能力和模块所有权；纯提交/worktree 操作不单独建 Issue | Goal 规划阶段 |
| 多 Agent 修改共享文件产生冲突 | 中/高 | 冻结共享契约、拆分模块路径、每个路径单一 owner、独立 worktree | 主控/各 Issue owner |
| 模型或 Embedding 费用可能超出获批上限 | 低/高 | 评测前核验 `.env` 中供应商、模型、合计费用上限和币种；Embedding 优惠由用户提供，须确认当前账号适用且仍有效；优惠失效或费用无法估算/控制在上限内时停止调用 | 用户/最终评测负责人 |

## 结束条件

- [ ] Q-01 的 Windows named volume 重启与配对备份/恢复已通过验证；macOS/Linux 未验证的平台行为明确标为 `not-run`。
- [x] Q-02 的模型、供应商、Embedding、合计上限和币种已写入本机 `.env` 并同步到 Goal/I-24；单次合成 Embedding smoke test 通过，完整真实 API 评测仍须满足认证、隔离数据与预算停止门禁。
- [ ] 用户批准 Goal 基线和完整 Issue 图；每个 G-* 均映射至 Issue 或终验。
- [ ] 所有批准范围内的 Issue 都有逐项 develop.md、人工审查通过的 PR 和确认合并 SHA。
- [ ] 功能、类型、Lint、构建、集成检查如实记录；未运行项标为 `not-run`。
- [ ] 端到端行为与 `../spec.md`、`../contracts/skill-workflow.md` 和用户文档一致。
- [ ] 最终集成 PR 经过人工审查验收并合并；交付报告列出真实验证证据、未解决项和已接受风险。

## 目标变更记录

| 版本 | 时间 | 变更 | 原因 | 用户确认 | 受影响 Issue/文档 |
| --- | --- | --- | --- | --- | --- |
| draft-1 | 2026-11-25 | 基于当前 Spec、Plan、Research、Data Model、Contracts、Quickstart、tasks.md 建立 Goal 草稿和 G-* 验收锚点 | 用户要求按 issue-pr-loop 继续并重审 Issue 单一职责/并行性 | pending | 全部；发布前需复核 |
| draft-2 | 2026-11-25 | 记录 Q-01 方案 A：Windows Qdrant 使用 Docker named volume，来源清单继续保存在 `dataHome()`；要求两者成对备份/恢复，并将平台验证纳入 I-21/I-22 | 用户选择方案 A | 已确认该存储决策；Goal 整体仍待审 | Plan、Research、Data Model、Contracts、Quickstart、I-03、I-21、I-22、I-23、Issue 图 |
| draft-3 | 2026-11-25 | 记录 Q-03 授权及 fork Issues 在线状态；更新 Q-02 为已授权封顶评测、具体模型和预算待通过本机 `.env` 补齐 | 用户选择开启 fork Issues，并选择有预算上限的真实评测 | Q-03 已解决；Q-02 仍待模型/供应商/金额/币种 | Issue 图、README、26 份 develop 计划、`.env.template` |
| draft-4 | 2026-11-25 | 记录 Q-02 确认的 OpenAI `gpt-5.6-luna`、`text-embedding-3-small` 与 `USD 5.00` 总上限；注明 API 计费/认证是实际评测前置，并同步 I-24 与 26 份计划引用 | 用户确认推荐配置；本机 `.env` 六项读回匹配 | Q-02 已解决；Goal 与 Issue 图仍待用户批准；I-24 保持 `not-run`，当前缺 API 凭据 | Goal、Issue 图、README、I-24、26 份 develop 计划 |
| draft-5 | 2026-11-25 | 将 I-24 Embedding 评测模型更新为讯飞星火 `xop3qwen8bembedding`，保留 `USD 5.00` 合计上限；记录单条合成 smoke test 的 HTTP 200、768 维、13 tokens，并区分完整评测仍待执行 | 用户确认替换 I-24 Embedding 模型并授权一条合成文本测试 | Q-02 已解决；全项目 Goal/Issue 图仍待审；I-24 完整评测仍未运行；产品 Embedding 基线是否切换保持待澄清 | Goal、Issue 图、README、I-24、26 份 develop 计划 |
| draft-6 | 2026-11-25 | 记录讯飞 Embedding 限时免费信息（截止 `2026-12-31 02:00`，时区未注明），将 smoke test 按优惠期内免费计入，同时保留响应未返回金额及总预算停止门禁 | 用户补充账号/活动优惠信息；公开资料未能独立核实该调用名对应的优惠细则 | Q-02 已解决；Goal/Issue 图仍待审；完整 I-24 评测仍未运行 | Goal、Issue 图、README、I-24、26 份 develop 计划 |
| draft-7 | 2026-11-25 | 将 CSV 业务 Goal 标记为暂缓，当前学习重心转到 TinyCode 通用 Agent Harness；记录以后开展真实业务场景二开时重新审阅和恢复的条件 | 用户决定暂不执行当前 Goal | Goal 保持未批准且暂缓；26 项功能 Issue 均未发布；只有用户明确恢复后才重新规划 | Goal、Issue 图、README、26 份 develop 计划；后续创建独立跟踪 Issue |
