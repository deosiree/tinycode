# Develop Plan：I-24 / GitHub Issue 待创建

## 状态与锚点

- 原任务映射（待审）：T056,T057。

- 状态：`draft`；Goal：[[../../goal.md]]（`draft-7`）；图谱：[[../../issue-graph.md]]；Goal IDs：G-03,G-06,G-09。
- Issue/PR：未创建；前置：I-21/I-22/I-23/I-26 合并；Q-02 已由用户确认：OpenAI `gpt-5.6-luna`、讯飞星火 Embedding `xop3qwen8bembedding`（OpenAI-compatible），LLM 与 Embedding 合计上限 `USD 5.00`。

## 背景、范围与契约

- 背景：自动化 mock 不能证明实际模型译文适用性；项目收尾需记录受控评测和真实限制。
- 包含：仅用已人工审阅、脱敏、版本化 fixture；隔离本地记忆；仅调用获批的 OpenAI `gpt-5.6-luna` 和讯飞星火 `xop3qwen8bembedding`，并将 LLM 与 Embedding 合计费用硬限制在 `USD 5.00`；分别取得 Add 和 task-query 授权；逐项人工判断术语/占位符/轨迹；记录 token、成本和失败项。
- 不包含：用户真实 CSV、未授权供应商、无上限费用、把 LLM judge 当作唯一真值。
- 输入：固定评测样例、隔离记忆、`.env` 中获批的模型/供应商和预算；输出：评测证据及交付报告。
- 环境：评测字段保存在 Git 忽略的 `.env`，TinyCode 不会自动加载这些字段。本机已对讯飞 `https://maas-api.cn-huabei-1.xf-yun.com/v2/embeddings` 发送一条合成短文本 smoke test，返回 HTTP 200、768 维向量及 13 input tokens。用户提供该接口优惠截止 `2026-12-31 02:00`（时区未注明），因此本次测试按优惠期内免费计入；公开资料未能独立核实该调用名对应的优惠细则。API 响应未返回货币金额，不能从响应独立核实扣费，且该测试不代表完整 I-24 评测。I-24 完整评测仍须确认优惠适用范围/有效状态、OpenAI LLM 路由认证、隔离 fixture 和总预算停止条件；任何费用估算超出 USD 5.00 或模型不在获批清单时停止调用。
- 文件边界：`specs/001-csv-term-translation/delivery-report.md`；评测 fixture 属于 I-21。

## 实施、测试与验收

| 节点 | 实施与验收 | 验证 |
| --- | --- | --- |
| N-01 | 运行前核对样例不含用户数据，记忆目录隔离，预算/停止条件明确 | 人工预检记录 |
| N-02 | 逐条检查译文适用性、固定术语、占位符和 search→模型→检查/HITL trace | 评测日志 + 人工签核 |
| N-03 | 汇总自动测试、CI、评测费用、未运行项和剩余风险 | 对照 G-* 证据表 |
| N-04 | 任一硬门禁失败按责任 Issue 回流，不改阈值规避失败 | 修复 PR 和复验记录 |

### 已有接口预检证据

| 项目 | 结果 |
| --- | --- |
| Embedding provider/model | 讯飞星火 / `xop3qwen8bembedding`，OpenAI-compatible |
| 请求 | 单次 POST，输入为合成短文本；不含用户 CSV 或参考文档 |
| 响应 | HTTP 200；返回模型 `xop3qwen8bembedding`、768 维向量、13 input tokens |
| 费用 | 用户提供接口限时免费至 `2026-12-31 02:00`（时区未注明）；本次按优惠期内免费计入。公开资料未能独立核实该调用名对应的优惠细则。API 响应未返回货币金额，报告需注明优惠信息来源，并核对完整评测总费用 |
| 覆盖范围 | 仅 endpoint smoke test；LLM 评测、Add/Search 集成、HITL 和交付验收仍未执行 |

| Case | 场景 | 预期 |
| --- | --- | --- |
| T-01 | `.env` 缺模型/供应商/上限/币种，或存在超预算风险 | 评测 `not-run`，不触发外部调用 |
| T-02 | 获批评测中出现硬规则失败 | 报告失败和样例，不宣称完成 |
| T-03 | 所有允许项完成 | 报告成本、人工结论、命令环境/commit 和未验证风险 |
| T-04 | `.env` 缺模型/供应商/金额/币种，或预计费用超过上限 | 不发起真实调用并将评测记录为 `not-run` |
| T-05 | OpenAI LLM API 计费/认证不可用，或只能使用 ChatGPT Free 网页会话 | 不发起 LLM 调用并将评测记录为 `not-run` |

- 交付：`delivery-report.md`、脱敏评测结果和 Goal→Issue→证据映射。
- 只有 G-* 均有证据，且人工评审/最终集成 PR 完成，才可判项目完成。

## 记录

- 授权、模型与预算：用户已确认并同步；用户提供讯飞 Embedding 限时免费至 `2026-12-31 02:00`（时区未注明）。单次合成 smoke test 按优惠期内免费计入，但公开资料未能独立核实该调用名对应的优惠细则，API 响应也未返回金额。OpenAI LLM 调用、完整评测结果、人工审查与合并 SHA 为 pending，I-24 整体保持 `not-run`。
- 最终汇报需区分本地检查、CI、外部模型运行和人工验收，不互相代替。
