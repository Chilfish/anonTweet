# Postmortem 工程学：方法论调研与 SRE 参考

写于 2026-09-18。本文合并两部分：postmortem 方法论的调研，以及 Google SRE 第 15 章《Postmortem Culture: Learning from Failure》的中文导读（见附录 A）。目的是为本站的 postmortem 体系找一套可辩护的标准，并说清它与业界做法的差距。

## 摘要

postmortem 不是「写一份事故报告」。它是一套把单次故障转成组织能力的机制，包含三件事：结构化的记录格式、无指责的归因方式、以及能被跟踪闭环的行动项。这套方法不是软件业原创，源头是人因工程、安全科学与制造业的根因分析，2012 年前后才由 Etsy 引入互联网运维，之后被 Google 写成标准流程并公开。

三条结论：

1. **格式只是入口，闭环才是本体。** 模板决定信息是否可聚合，但决定改进是否发生的，是「谁在什么时候之前完成哪一条动作」。绝大多数组织的 postmortem 失败在闭环，不在格式。
2. **blameless 是手段不是目的。** 它的价值是心理安全，让人敢暴露问题；它不排斥明确指出系统缺陷，只反对归因到人。
3. **单份报告的价值有限，聚合分析才产生系统收益。** Google 靠统一字段做趋势分析，把「哪个根因类型最常出现」变成改进优先级。没有统一字段，报告就只是档案。

## 一、定义与边界

postmortem 是一份关于事故的书面记录，含事故本身、影响、处置过程、根因和后续预防动作（Google SRE 书的定义）。

容易混淆的几个概念：

| 概念 | 关注点 | 与 postmortem 的区别 |
| ---- | ------ | -------------------- |
| RCA（根因分析） | 为什么发生 | 只回答原因，不含影响、时间线、行动项闭环 |
| 事后复盘 / retrospective | 团队协作与流程 | 通常面向迭代过程，不一定针对一次事故 |
| Bug report | 单个缺陷 | 面向单个缺陷，不做系统条件分析 |
| Postmortem | 一次事故的全貌与预防 | 覆盖触发、检测、处置、根因、行动项，并要求评审与沉淀 |

postmortem 与 RCA 的关键差异是系统思维：RCA 传统上倾向找「单一失效点」，postmortem 承认多贡献因素（multiple contributing causes），关注「什么系统条件允许它发生」。

## 二、思想源流

### 2.1 人因与安全科学

- **Sidney Dekker** 提出的「新视角」（new view）反对把事故归因于「人为错误」这个终点。他的书 *The Field Guide to Understanding "Human Error"* 论证：错误是系统的产物，把因果停在「人失误」等于停止调查 [5][4]。
- **Just Culture**（公正文化）来自医疗与航空，主张区分「人为疏忽」「危险行为」「鲁莽行为」，在追责与学习之间取得平衡；Boysen 在 *Ochsner Journal* 上把它系统介绍给医疗界 [6]。
- **Richard Cook** 的《How Complex Systems Fail》用 18 条断言说明复杂系统为何必然失效，其中多条直接支撑 blameless：「复杂系统靠多重防御运行」「操作者是系统韧性的主要来源」「事后很难还原当时的信息与约束」[3]。
- **Charles Perrow** 的 *Normal Accidents* 提出「正常事故」理论：在紧耦合、强交互的复杂系统里，事故是系统性特征而非异常 [7]。
- **Lisanne Bainbridge** 的《Ironies of Automation》（1983）指出自动化越多，人越难在异常时接管，为「不指责操作者」提供了工程解释 [8]。

### 2.2 制造业与根因分析方法

- **大野耐一** 在丰田生产方式中提出 5 Whys：连续追问「为什么」，直到触及流程而非症状 [9]。
- **Rooney 与 Vanden Heuvel** 的《Root Cause Analysis for Beginners》把 RCA 工具（5 Whys、因果图、故障树）整理成可操作流程，是软件业最常引用的入门材料 [10]。

### 2.3 引入互联网运维

- **John Allspaw** 的博文《Blameless PostMortems and a Just Culture》（Etsy，2012）是分水岭。他把医疗与航空的公正文化翻译成运维语言，明确「人不是根因，系统条件才是」[1]。
- 同一时期，**John Loomis** 的《How to Make Failure Beautiful: The Art and Science of Postmortems》与 Allspaw、Robbins 的 *Web Operations* 一起，把 postmortem 从个人习惯变成团队实践 [11]。
- Allspaw 后来的硕士论文《Trade-Offs Under Pressure》用观察研究分析真实故障中工程师的启发式决策，是这一领域少见的实证工作 [2]。

### 2.4 韧性工程与 Safety-II

从 Safety-I（减少失效）转向 Safety-II（理解正常工作如何产生）的思潮，进一步强化了 postmortem 的方向：不只问「哪里坏了」，也问「为什么大多数时候没坏」。这与本仓库报告里的「做得对的地方」一节同源。

## 三、行业实践

### 3.1 Google SRE

Google 把 postmortem 做成标准化流程，要点：先定触发条件再谈怎么写；统一模板以便横向聚合；强制评审（No Postmortem Left Unreviewed），草稿由资深工程师评估完整性与行动项优先级，定稿后进入可检索的故障库；公开表彰做得好的报告与处置；并有跨团队工作组维护模板、自动化生成与数据抽取。完整的原始要点见附录 A。

### 3.2 Etsy

Etsy 是这套文化在互联网业的早期实践者，并开源了 postmortem 管理工具 **Morgue**，用于存储、检索和复盘历史事故 [18]。它的贡献更多在文化示范而非流程规则。

### 3.3 平台化与模板产业

PagerDuty 把事故响应流程开源（incident response 文档），其中 postmortem 一节强调时间线重建与行动项归属 [19]。Atlassian、Rootly 等厂商把 postmortem 做成模板与工作流产品 [20]。这一层让中小团队更容易起步，但产品化的模板良莠不齐，常见问题是字段齐全而缺闭环机制。

### 3.4 高风险行业

- **航空**：事故调查制度化最早，且有自愿报告系统（如 ASRS），把「主动上报」与「追责」分离。这是 blameless 的制度原型。
- **核电**：IAEA 的安全设计标准与运行经验反馈体系，把「事件报告—根因—纠正措施—验证」写成闭环 [13]。本仓库 postmortem 的「预防动作 + 完成判据」结构与之同构。
- **医疗**：MorbiDity & Mortality 会议是常规化的同行评审；Gawande 的 *The Checklist Manifesto* 把「清单」引入高风险操作，与本仓库「高频雷区自查清单」是同一思路 [12]。

一个值得软件业借鉴的公开案例是 **Knight Capital**：2013 年 SEC 的处罚文件还原了一次部署失误如何在 45 分钟内造成 4.6 亿美元损失，是「变更部署规划不成熟」这类根因的经典样本 [14]。

## 四、模板要素对比

| 要素 | Google SRE | 业界通用 | 本仓库 TEMPLATE |
| ---- | ---------- | -------- | --------------- |
| 摘要 | 有 | 有 | 有 摘要 |
| 影响（含量化） | 有 | 有 | 有 影响 |
| 时间线 | 有 | 有 | 有 时间线 |
| 根因 / 贡献因素 | 有 | 有 | 有 根因分析 |
| 触发条件 | 有（独立字段） | 常合并进根因 | 有 触发条件 |
| 检测 | 有 | 有时缺 | 有 检测 |
| 处置 | 有 | 有 | 有 处置 |
| 行动项 + 类型 | 有，且挂工单号 | 多数只写动作 | 有，分缓解/预防，带负责人与判据 |
| 负责人 / 截止 | 有 | 常缺 | 负责人有，截止无 |
| 做得好 / 幸运 | 有 | 常缺 | 有 做得对的地方 |
| 评审记录 | 有 强制 | 常缺 | 无 |
| 支持材料（日志/看板链接） | 有 | 有时缺 | 无 |

结论：本仓库模板在字段覆盖上已接近 Google 水平，缺的是流程侧的两项——**评审环节**与**支持材料链接**，以及度量侧的**趋势聚合**。

## 五、Google 的聚合数据

Google 用统一模板对近七年、数千份 postmortem 做过统计分析 [17]。两个分布值得记住：

事故触发条件（2010–2017）：

| 触发 | 占比 |
| ---- | ---- |
| 二进制发布 | 37% |
| 配置发布 | 31% |
| 用户行为变化 | 9% |
| 处理管线 | 6% |
| 服务提供方变更 | 5% |
| 性能衰退 | 5% |
| 容量管理 | 5% |
| 硬件 | 2% |

根因类别：

| 类别 | 占比 |
| ---- | ---- |
| 软件缺陷 | 41.35% |
| 开发流程失效 | 20.23% |
| 复杂系统行为 | 16.90% |
| 部署规划 | 6.74% |
| 网络故障 | 2.75% |

可迁移的判断：**变更类触发占近七成**（发布 + 配置），**流程类根因约占两成**。也就是说，多数事故与「改了什么」有关，而非「跑久了自然坏」。这与本仓库多个报告的结论一致（#004 构建、#010 依赖、#011 门禁都属于变更与流程）。

## 六、常见反模式

| 反模式 | 表现 | 后果 |
| ------ | ---- | ---- |
| 归因人 | 「谁写的」「谁推的」 | 心理安全崩塌，问题被隐藏 |
| 单一根因 | 硬凑一句根因 | 遗漏贡献因素，同类问题复发 |
| 行动项无主 | 只有动作，无负责人与截止 | 永远不关闭 |
| 行动项过重 | 「重写整个模块」 | 成本高到无法执行，等于没提 |
| 只写不读 | 无人评审，不进索引 | 报告等于不存在 |
| 无触发条件 | 随机决定写不写 | 覆盖不稳定，趋势分析失真 |
| 把 RCA 当 postmortem | 只有根因，无影响/时间线/行动项 | 无法复盘处置，无法度量 |
| 无聚合字段 | 每份格式各异 | 无法做趋势分析，改进无优先级 |
| 事后追认式 | 从 git 历史补写，无实时数据 | 时间线粗、检测与处置细节缺失 |

## 七、度量与趋势分析

可比指标（由统一模板保证可提取）：

- 事故数量与严重级别分布，按月/季；
- 触发条件分布与根因类别分布，对比 Google 的基线；
- 行动项关闭率、平均关闭时间、逾期率；
- 复发率：同一根因类别再次出现的事故数；
- 检测来源：监控发现 vs 人工发现的比例，人工发现占比高说明监控有盲区。

Google 的做法是把这些做成「按根因类型排序的改进清单」，而不是按事故数量排序。对本仓库这种单人项目，可退化为季度看一次：高危文件与高频雷区是否仍在改动、未关闭的预防项是否还合理。

## 八、对本仓库的落地建议

已对齐：字段覆盖、blameless 表述、触发条件/检测/处置分节、行动项分缓解与预防、SEV 分级有明确判据、单份报告有 Changed Files 便于后续交叉检查。

仍有差距，按性价比排序：

1. **行动项闭环**：给每条加状态跟踪（现有 `[ ]` 只是勾选，没有截止与关闭记录）。单人项目可退化为「季度自查未关闭项」。
2. **评审环节**：目前没有「已评审」记录。最少做法是在报告元信息里加一个评审日期，或在 README 里维护一份已评审清单。
3. **支持材料**：关键报告应附可复现证据（命令、payload、日志、看板链接）。#009 之所以能快速定位，正是因为用户贴了 `/api/tweet/set` 的 payload。
4. **趋势聚合**：把「严重级别 / 分类 / 根因归类」当作可聚合字段，季度统计触发与根因分布，与 Google 基线对比。
5. **降低门槛**：报告不必都写成全套模板。轻量事故用短表（摘要 + 根因 + 行动项），重大事故用全套，避免模板成本压垮习惯。

## 参考文献

1. J. Allspaw, *Blameless PostMortems and a Just Culture*, Etsy Code as Craft, 2012. https://codeascraft.com/2012/05/22/blameless-postmortems/
2. J. Allspaw, *Trade-Offs Under Pressure: Heuristics and Observations of Teams Resolving Internet Service Outages*, MSc thesis, Lund University, 2015. https://lup.lub.lu.se/student-papers/record/8084520/file/8084521.pdf
3. R. I. Cook, *How Complex Systems Fail*, 2000. https://web.mit.edu/2.75/resources/random/How%20Complex%20Systems%20Fail.pdf
4. S. Dekker, *Reconstructing human contributions to accidents: the new view on error and performance*, Journal of Safety Research, 2002. https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.411.4985&rep=rep1&type=pdf
5. S. Dekker, *The Field Guide to Understanding "Human Error"*, 3rd ed., Ashgate, 2014.
6. P. G. Boysen, *Just Culture: A Foundation for Balanced Accountability and Patient Safety*, The Ochsner Journal, 2013. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3776518/
7. C. Perrow, *Normal Accidents: Living with High-Risk Technologies*, Princeton University Press, 1999.
8. L. Bainbridge, *Ironies of Automation*, Automatica, 1983. https://dx.doi.org/10.1016/0005-1098(83)90046-8
9. T. Ohno, *Toyota Production System: Beyond Large-Scale Production*, Productivity Press, 1988.
10. J. J. Rooney, L. N. Vanden Heuvel, *Root Cause Analysis for Beginners*, Quality Progress, 2004. https://asq.org/quality-progress/2004/07/quality-tools/root-cause-analysis-for-beginners.html
11. J. Loomis, *How to Make Failure Beautiful: The Art and Science of Postmortems*, in *Web Operations*, O'Reilly, 2010.
12. A. Gawande, *The Checklist Manifesto*, Henry Holt, 2009.
13. IAEA, *Safety of Nuclear Power Plants: Design (SSR-2/1)*, 2012. https://www-pub.iaea.org/MTCD/publications/PDF/Pub1534_web.pdf
14. U.S. SEC, *Order In the Matter of Knight Capital Americas LLC*, 2013. https://www.sec.gov/litigation/admin/2013/34-70694.pdf
15. B. Beyer et al., *Site Reliability Engineering*, ch.15 "Postmortem Culture: Learning from Failure", O'Reilly, 2016. https://sre.google/sre-book/postmortem-culture/
16. B. Beyer et al., *Site Reliability Engineering*, Appendix D "Example Postmortem". https://sre.google/sre-book/example-postmortem/
17. B. Beyer et al., *The Site Reliability Workbook*, Appendix C "Results of Postmortem Analysis". https://sre.google/workbook/postmortem-analysis/
18. Etsy, *Morgue*（postmortem 管理工具）. https://github.com/etsy/morgue
19. PagerDuty, *Incident Response Documentation*. https://response.pagerduty.com/
20. Atlassian, *Incident Postmortem 指南*. https://www.atlassian.com/incident-management/postmortem
21. K. Krishan, *Weathering The Unexpected*, Communications of the ACM, 2012.
22. B. Maurer, *Fail at Scale*, ACM Queue, 2015.
23. D. Kahneman, *Thinking, Fast and Slow*, Farrar, Straus and Giroux, 2011.
24. D. Meadows, *Thinking in Systems*, Chelsea Green, 2008.
25. M. Bland, *Goto Fail, Heartbleed, and Unit Testing Culture*, 2014. https://martinfowler.com/articles/testing-culture.html

## 附录 A. Google SRE《Postmortem Culture: Learning from Failure》中文导读

> 原文：John Lunney、Sue Lueder 撰写，Gary O'Connor 编辑，出自 *Site Reliability Engineering* 第 15 章。
> 链接：https://sre.google/sre-book/postmortem-culture/
> 许可：CC BY-NC-ND 4.0（署名—非商业—禁止演绎）。
> 本附录是原创中文导读，按原文结构转述其论点，不是逐句翻译。原因是翻译构成演绎作品，与原文的「禁止演绎」条款冲突，而本仓库是 MIT（允许商用），直接收录译文会产生许可问题。需要原文表述请访问上方链接。

### A.0 这一章要解决的问题

在高速变更的分布式系统里，事故是必然的。修好一次事故不等于学会了：如果没有把事故固化成可复用的流程，同类问题会一次次重复，复杂度还会累加，最终压垮系统与当班工程师。postmortem 就是这个流程。

### A.1 Google 的 postmortem 理念

- 写 postmortem 有三个目标：把事故记录下来、把全部贡献性根因弄清楚、尤其是落实能降低复发概率或影响的预防动作。
- postmortem 不是惩罚，是给整个组织的学习机会，因此文化上必须无指责。
- 根因分析技术并不唯一（5 Whys、贡献因素列表、故障树等），Google 让各团队按自己服务的特点选。
- 写 postmortem 有时间和精力成本，所以要有意识地选择何时写，而不是每件小事都写。

### A.2 什么时候写（触发条件）

Google 建议在事故之前就把触发条件定好，让所有人都知道何时必须写。常见触发：

- 用户可见的停机或降级超过某个阈值；
- 任何形式的数据丢失；
- 需要 on-call 介入，例如回滚发布、切换流量；
- 解决时间超过某个阈值；
- 监控失效，通常意味着事故是靠人工才发现的。

除这些客观条件外，任何相关方都可以提议写一份。

### A.3 blameless 的含义与边界

- 真正的 blameless 指：聚焦贡献原因，不指控任何个人或团队；默认每个参与者都是凭当时掌握的信息做了正确的事。
- 理由是心理安全。一旦形成指责与羞辱的文化，人们就不愿把问题摆上台面，组织的风险反而更高。
- 这一做法源自医疗与航空：把每个错误当作加固系统的机会。人可以换，能改的是系统与流程。
- 边界：blameless 不等于含糊其辞。报告仍要明确点出服务哪里、怎么改进，只是不把矛头指向人。

### A.4 协作与知识共享

- postmortem 不是一份填完就归档的表格，流程的每一步都强调协作与共享。
- Google 用内部文档加统一模板。无论用什么工具，关键特性是：实时协作、开放的评论与批注、通知机制。
- 有正式的评审与发布环节：先在内部传阅草稿，请资深工程师评估完整性。评审关注的问题包括——关键事故数据是否留存、影响评估是否完整、根因挖得是否够深、行动项是否合适且优先级合理、结论是否同步给了相关方。
- 「No Postmortem Left Unreviewed」：没人评审的 postmortem 等于没写过。做法是定期开评审会，收口讨论、敲定状态。
- 定稿后进入团队或组织的故障库。透明分享，别人才检索得到、学得到。

### A.5 引入 postmortem 文化

- 文化需要持续培育，不是发一份模板就完事。高层的参与和示范最有效，但理想状态是工程师自发推动。
- 常见传播形式：月度精选一份写得好的报告、内部讨论组、读书会，以及用旧报告做「灾难角色扮演」演练（Wheel of Misfortune），让新人扮演当时的角色重演一遍。
- 应对「成本太高」的质疑有三条经验：先小范围试点证明价值；公开表彰写得好的报告；争取高层认可。
- 公开奖励做对的人。书里的例子是一位工程师发布后 4 分钟内果断回滚，避免了大范围故障，随即获得同事表彰。
- 定期调研流程本身是否有效，例如问一线：文化是否支持你的工作、写 postmortem 是否变成负担、有哪些好的做法可以推广。

### A.6 持续改进

- 有了统一模板，事故数据才能横向聚合，进而做趋势分析，针对系统性的根因类型（比如接口设计缺陷、变更部署规划不成熟）制定改进，而不是逐个救火。
- Google 有一个跨产品的「Postmortems at Google」工作组，统筹模板、用事故工具自动生成 postmortem，并从 postmortem 里自动抽取数据做趋势分析。

## 延伸阅读

- 报告字段标准与写作要求：`TEMPLATE.md`
- 报告索引、高危文件与高频雷区：`README.md`
- 模板示例：https://sre.google/sre-book/example-postmortem/
