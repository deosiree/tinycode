# CSV 翻译 Issue 规划材料

## 状态

- `goal.md` 和 `issue-graph.md` 是待用户审阅的草稿，尚未批准为开发基线；用户已决定暂缓该 CSV 业务 Goal，当前学习主线转为 TinyCode 通用 Agent Harness。GitHub [#2](https://github.com/deosiree/tinycode/issues/2) 跟踪未来恢复入口，并链接至 [feature/csv-term-translation](https://github.com/deosiree/tinycode/tree/feature/csv-term-translation) 规划分支（快照 `9d969e0`）。
- 当前图谱有 26 个候选 Issue；Add、Search、来源软删除/恢复分别负责独立服务，真实记忆集成和 Agent workflow E2E 也分层验收。
- 26 个候选功能 Issue 暂不执行；以后明确开始真实业务场景二开时，先重新核对仓库状态并审阅 Goal、Issue 图和具体计划。经用户批准后只针对 `deosiree/tinycode` fork 创建功能 Issue。
- 用户已授权在 fork 使用 GitHub Issues；在线核验显示功能已开启。当前仅有暂缓跟踪 Issue #2；26 个候选功能 Issue 尚未发布，仍须逐项经用户审阅批准。
- Q-01 已按用户选择解决：Windows Qdrant 使用 Docker named volume，来源清单留在 `dataHome()`；I-21/I-22 负责重启、配对备份恢复和平台验证证据。
- Q-02 已确认：I-24 使用 OpenAI `gpt-5.6-luna` 与讯飞星火 Embedding `xop3qwen8bembedding`（OpenAI-compatible），合计上限 `USD 5.00`。用户提供该接口限时免费至 `2026-12-31 02:00`（时区未注明）。一条合成文本 smoke test 已通过（HTTP 200、768 维、13 tokens），按优惠期内免费计入，但 API 响应未返回货币金额；公开资料未能独立核实该调用名对应的优惠细则。完整真实评测仍为 `not-run`。产品设计中的 OpenAI Embedding 基线未由此次 I-24 决策自动变更。

## 文件

- [[goal.md]]：项目目标、范围、已确认决策、待澄清项和 G-* 验收锚点。
- [[issue-graph.md]]：依赖事实表、并行组、文件所有权、任务编号重映射及 Goal 覆盖。
- [[issues/]]：26 个候选 Issue 的逐项 develop 计划草稿。

## 执行约束

- 每个 Issue 只修改依赖图列出的路径；共享接口先冻结。
- 独立 Issue 使用独立 worktree/分支；最多 3 个 Agent 同时执行。
- 依赖图的 `blocked_by` 是解锁事实；开发、验证、提交 PR、人工审查和合并逐项记录。
- `tasks.md` 基线已包含于 `c4a788e`；本地草稿不改该文件。任务重排获用户审阅后，再单独同步 Spec/Plan/Tasks。
- `.env.template` 是可提交的评测授权输入模板；本机 `.env` 已被 Git 忽略，填写费用和模型信息后通知主控读取。

## 发布检查

- [ ] 用户确认 Goal 和全局验收标准。
- [ ] 用户确认 26 项职责、依赖、文件边界和任务编号重排。
- [ ] I-21/I-22 已记录 Windows named volume 的重启、配对备份恢复证据；macOS/Linux 未验证的持久化命令标注为 `not-run`。
- [ ] 用户逐项批准待发布的 Issue 草稿；只操作 `deosiree/tinycode` fork。
- [x] Goal Q-02 的模型、供应商、费用上限和币种已填写并同步到 I-24；单次 Embedding smoke test 按用户提供的限时免费信息计为免费，完整 API 评测仍待隔离数据、优惠适用性和总预算核对。
- [ ] 检查实时 GitHub 状态，确认无重复 Issue/PR 并核验 base 分支。

## 暂缓与恢复

- 当前保留规划草稿，不实现 CSV 词条翻译功能，也不发布 26 个候选功能 Issue。
- 用户以后明确要实战真实业务场景二开时，再重新审阅规格、Goal、依赖图、费用授权和实时仓库状态，决定是否恢复。
