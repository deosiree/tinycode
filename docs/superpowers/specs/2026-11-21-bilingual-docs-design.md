# TinyCode 中文优先文档设计

日期：2026-11-21

## 目标

将仓库默认文档调整为中文优先，同时保留现有英文文档，并确保仓库内部引用仍准确。

## 文档布局

- 根目录 `README.md` 使用简体中文。
- 将当前英文 `README.md` 内容保留为 `README.en.md`。
- `ARCHITECTURE.md` 保留英文；新增对应的简体中文版 `ARCHITECTURE.zh-CN.md`。
- 两份 README 和两份架构说明顶部都提供语言切换，顺序为“简体中文 | English”。
- 两份 README 的架构文档链接均先列中文版，再列英文版。

## 内容与引用约定

- 忠实翻译当前 README 和架构说明，保留命令示例、代码标识符、安全语义和章节覆盖范围。
- 仅参考 OpenViking README 的简洁语言切换入口，不照搬其内容或整体版式。
- 更新 `docs/wiki` 中引用英文 README 内容或行号锚点的来源链接，使其指向 `README.en.md`。架构说明来源继续指向 `ARCHITECTURE.md`，除非具体内容需要中文版。
- 不新增桌面/Electron 功能，不修改运行时代码。
- 不触碰无关文件，包括已有的 `package-lock.json` 与 `tests/permissions.test.ts` 修改。

## 验收标准

- 根目录 `README.md` 为简体中文并链接 `README.en.md`，语言入口中文优先。
- `README.en.md` 保留现有英文 README 内容并优先链接回中文。
- 两份架构文档均存在，章节结构对应，并以相同的中文优先顺序互相链接。
- 所有此次修改的本地 Markdown 链接均有效，包括原先指向英文 README 的 wiki 来源引用。
- 最终检查差异，只包含本次批准的文档变更；原有工作树修改保持不变。

## 不在范围内

- 翻译 `docs/wiki` 正文。
- 除必要路径和语言入口调整外，重写英文 README 或架构说明。
- 修改应用行为、构建配置或依赖。
- 推送 `main` 或发布尚未审阅的内容。
