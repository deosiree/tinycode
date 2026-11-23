# 中文优先文档实施计划

> **执行说明：** 按任务逐项执行，保留所有无关工作树改动。仅暂存本计划列出的文档文件；完成验证后在当前功能分支提交、推送并创建 PR，不推送 `main` 上未提交内容。

**目标：** 将 TinyCode 根 README 改为简体中文，保留英文文档，并为 README 与架构说明提供中文优先的语言跳转。

**方案：** 保留英文架构文档 `ARCHITECTURE.md`，将现有英文 README 内容迁至 `README.en.md`。创建两份中文文档的对应关系，加入双向语言入口，再把引用英文 README 行号的 wiki 来源链接改到 `README.en.md`。

**技术栈：** Markdown、Git、PowerShell 只读检查。

---

### 任务 1：保留现有英文 README

**文件：**
- 新建：`README.en.md`，内容从当前 `README.md` 完整复制。
- 修改：`README.en.md` 的语言入口与架构链接。

- [ ] 在替换根 README 前，将现有 `README.md` 完整复制到 `README.en.md`，不删章节、不改英文正文。
- [ ] 顶部添加 `[简体中文](./README.md) | English`。
- [ ] 文档表中先列 `ARCHITECTURE.zh-CN.md`，再列 `ARCHITECTURE.md`。
- [ ] 对照原 README，确认章节与命令示例均完整保留。

### 任务 2：将根 README 设为中文优先

**文件：**
- 修改：`README.md`

- [ ] 将现有 README 翻译为简体中文，保留标题顺序、徽章、命令、代码标识符、安全语义、相对链接、表格与示例。
- [ ] 顶部添加 `[简体中文](./README.md) | [English](./README.en.md)`，中文在前。
- [ ] Documentation 章节先列中文版架构说明，再列英文版。
- [ ] 对照 `README.en.md` 检查标题与代码围栏；不增加桌面/Electron 范围。

### 任务 3：新增中文版架构说明

**文件：**
- 新建：`ARCHITECTURE.zh-CN.md`
- 修改：`ARCHITECTURE.md`

- [ ] 在 `ARCHITECTURE.md` 顶部添加 `[简体中文](./ARCHITECTURE.zh-CN.md) | [English](./ARCHITECTURE.md)`。
- [ ] 将架构说明的 12 个章节及末尾能力归属表完整翻译到 `ARCHITECTURE.zh-CN.md`。
- [ ] 保留源文件路径、代码/API 名称、命令示例、数据流、安全语义，以及 Pi 与 TinyCode 的职责区分。
- [ ] 中文版顶部添加反向语言入口，并保持“简体中文 | English”顺序。
- [ ] 对照两份架构文件检查章节编号与代码围栏。

### 任务 4：将 wiki 来源引用指向英文 README

**文件：**
- 修改以下 wiki 文件中指向英文 README 的引用：
  - `docs/wiki/1-xiang-mu-gai-lan-ge-ke-yi-xia-wu-du-wan-de-bian-ma-zhi-neng-ti-gu-jia.md`
  - `docs/wiki/3-pei-zhi-ti-xi-config-json-huan-jing-bian-liang-yu-mi-yao-an-quan-guan-li.md`
  - `docs/wiki/16-an-quan-mo-xing-sheng-ming-shen-pi-ceng-jia-lu-jing-shou-wei-bing-fei-cao-zuo-xi-tong-sha-xiang.md`
  - `docs/wiki/17-gong-ju-jie-guo-jie-duan-ce-lue-tou-wei-bao-liu-yu-wan-zheng-shu-chu-gui-dang-wei-gong-jian.md`
  - `docs/wiki/27-zhi-liang-men-jing-pty-ji-tui-ce-shi-yu-node-duo-ban-ben-ci.md`

- [ ] 将这些文件中指向旧英文 README 的链接目标从 `README.md` 改为 `../../README.en.md`，保留行号锚点和周围英文引文。
- [ ] 不改 `ARCHITECTURE.md` 或源代码引用。
- [ ] 检查差异，确认只改动指向英文源文档的路径。

### 任务 5：验证文档变更

**文件：** 上述所有文件。

- [ ] 运行 `git diff --check`；预期退出码 0 且没有空白错误。
- [ ] 搜索失效的旧英文 README 行号引用：`git grep -n 'README\.md#' -- docs/wiki`；预期无匹配。
- [ ] 确认 `README.md`、`README.en.md`、`ARCHITECTURE.md`、`ARCHITECTURE.zh-CN.md` 均存在，语言入口均指向对应语言且中文优先。
- [ ] 检查本次修改的相对 Markdown 链接，确认目标文件存在。
- [ ] 检查 `git status -sb` 与最终差异，确保只暂存本次文档文件，既有 `package-lock.json` 与 `tests/permissions.test.ts` 修改未被触碰。
- [ ] 此次仅改文档，不重跑产品测试；此前 CLI/TUI 验收结果不受 Markdown 变更影响。
- [ ] 仅提交本次文档范围到功能分支，推送该分支并创建 PR；不推送 `main` 上未提交改动。
