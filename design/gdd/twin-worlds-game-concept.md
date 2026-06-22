# Game Concept: 双生世界 (Twin Worlds)

*Created: 2026-06-21*
*Status: Approved (Brainstorm)*

---

## Elevator Pitch

> 一个按键就能在「光明」与「黑暗」两个重叠世界间瞬间切换的横版冒险——光里是路的地方，暗里就是深渊。你边跑边在两个现实之间精准硬切，踩着此消彼长的平台冲向终点。
>
> 10 秒测试：看到一次"脚下平台消失、另一个世界的平台浮现"的切换，你就懂怎么玩了。

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | 横版动作平台（Side-scrolling Platformer）+ 双世界切换机制 |
| **Platform** | Web / H5 浏览器（移动端优先，桌面兼容） |
| **Target Audience** | 成就者 + 反应挑战玩家（详见 Player Profile） |
| **Player Count** | 单人 |
| **Session Length** | 5–20 分钟（单局闯 1 个章节） |
| **Monetization** | 无（仓库内开源休闲合集） |
| **Estimated Scope** | Small (1–2 周可玩版本，单人；完整愿景 4–6 周，单人) |
| **Comparable Titles** | VVVVVV、Geometry Dash、Super Meat Boy、The Bridge |

---

## Core Fantasy

玩家获得的是 **「看穿双重现实、在险象环生中精准抉择」** 的掌控感。你不是只会跳的角色——你能看见两个世界叠加的全貌，并在千钧一发的瞬间决定"此刻我要活在哪个世界里"。当一连串切换-跳跃行云流水地完成时，那种"我读懂了世界"的快感是别处给不了的。

---

## Unique Hook

**像马里奥，但每一跳你都在两个现实之间豪赌平台是否存在。**

- 一句话可解释：一个键瞬间切换光/暗世界，只有当前世界的平台是实体。
- 真正影响玩法：切换不是装饰，它决定脚下是路还是空。错误时机的切换 = 坠落。
- 紧扣核心幻想：双世界永远同屏可见（非激活世界以幽灵轮廓呈现），所以"看穿"是必备技能，切换时机是核心抉择。

---

## Player Experience Analysis (MDA Framework)

### Target Aesthetics

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Sensation** | 1 | 整屏反色翻转 + 顿帧 + 粒子 + WebAudio 切换音；纯色块强对比双色美术 |
| **Challenge** | 2 | 切换时机的精度门槛、技巧上限高、速通空间大 |
| **Discovery** | 3 | 每关一个新的双世界小花样；幽灵轮廓里藏着的安全路径 |
| **Fantasy** | 4 | "活在两个世界之间"的角色幻想 |
| Narrative / Fellowship / Expression / Submission | N/A | 不在范围内 |

### Key Dynamics
- 玩家会**先用眼睛"扫描"两个世界的叠加图**，再规划切换点。
- 玩家会自发追求**连续不落地的丝滑切换**与速通时间。
- 失败后玩家会**立刻复盘"我早切/晚切了多少"**并重试。

### Core Mechanics
1. 全操控平台物理（重力、可变高度跳跃、左右移动、碰撞）
2. 瞬时硬切双世界（仅激活世界的瓦片为实体，非激活世界显示为幽灵轮廓）
3. 检查点 + 秒级重生（公平死亡、慷慨重来）

---

## Player Motivation Profile

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** | 每个空隙都有"切不切 / 何时切"的微决策 | Core |
| **Competence** | 从手忙脚乱到行云流水，死亡数下降、速通时间可见 | Core |
| **Relatedness** | 单机偏弱，用本地最佳成绩 / 分享截图弥补 | Minimal |

### Player Type Appeal (Bartle)
- [x] **Achievers** — 全收集宝石、通关全部关卡、刷新最佳时间
- [x] **Explorers** — 解读双世界叠加图、发现隐藏安全路径
- [ ] Socializers — 非目标
- [x] **Killers/Competitors** — 本地最佳时间（速通自我竞争）

### Flow State Design
- **Onboarding**：第 1 关只在"双世界实体地面"上教移动/跳跃，再引入第一次必需切换。
- **Difficulty scaling**：从单次切换 → 连续切换 → 空中切换 → 垂直段连切。
- **Feedback clarity**：死亡即时高亮死因（坠落/尖刺/挤压），死亡计数与计时可见。
- **Recovery**：死亡 < 1 秒秒回最近检查点，惩罚极轻、教育性强。

---

## Core Loop

### Moment-to-Moment (30 秒)
跑动 → 遇空隙/障碍 → 瞬间判断"光世界 vs 暗世界哪个有安全落点" → **硬切 + 跳** → 落地续跑。

### Short-Term (5–15 分钟)
单关 = 一串"切换-跳跃"挑战 + 沿途宝石 + 检查点，终点旗帜。死亡秒回检查点驱动"再来一次"。

### Session-Level (单局 5–20 分钟)
连闯数关构成一个主题章节，关卡之间是自然停止点；回来的理由 = 刷通关时间 / 全收集 / 挑战更难的关。

### Long-Term Progression
成长 = 玩家"看穿双世界"的反应速度↑ + 解锁新的双世界花样（只在光里的敌人/尖刺、只在暗里的移动平台、必须空中连切的陷阱）。终局 = 通关全部 + 速通/全收集成就。

### Retention Hooks
- **Curiosity**：下一关又有什么新双世界花样？
- **Investment**：最佳时间与全收集进度（本地存档）。
- **Mastery**：把磕磕绊绊的关刷成丝滑速通。

---

## Game Pillars

### Pillar 1: 一眼看穿，瞬间抉择
双世界状态永远清晰可读，失败只会是"我反应慢"而非"我没看清"。
*Design test*：信息清晰 vs 美术华丽冲突时 → 选清晰可读。

### Pillar 2: 单键魔法
核心魔法只有"切换"一个键，所有深度从它的时机与组合中生长。
*Design test*：想加新动作/新键时 → 先问"能否用 切换+跳 的组合实现？"

### Pillar 3: 公平的死亡，慷慨的重来
死亡让玩家立刻明白原因，且秒回检查点。
*Design test*：惩罚 vs 流畅冲突时 → 选流畅（轻惩罚、快重生）。

### Pillar 4: 每关一个新念头
每关引入/组合一个双世界小花样，保持新鲜。
*Design test*：复用旧机制 vs 引入新变化 → 主线关选新变化。

> 健康张力：Pillar 2（克制·单键）与 Pillar 4（求变·新花样）互相拉扯，逼迫新鲜感只能从"切换"机制的新组合里生长，而非堆按键。

### Anti-Pillars (What This Game Is NOT)
- **NOT 复杂连招/多技能体系**：会破坏 Pillar 2「单键魔法」。
- **NOT 硬核惩罚（掉命扣分、退回起点）**：会破坏 Pillar 3「慷慨重来」。
- **NOT 大段剧情过场**：偏离纯爽核心循环，且增加单文件体积。
- **NOT 需下载的外部资源（大图/音频库）**：违背本仓库「单文件零依赖」铁律。

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| VVVVVV | 单机制 + 高重复挑战 + 秒重生 | 用"世界切换"替代"重力翻转"，且双世界同屏可见 | 验证"单一硬核机制 + 慷慨重来"在小体量也能上瘾 |
| The Bridge / 双世界叠加类 | 两个状态叠加的空间解读 | 强调实时动作而非慢解谜 | 验证"看穿叠加图"是有趣的核心技能 |
| Geometry Dash | 极爽反馈 + 速通 + 易分享 | 玩家全操控而非纯自动跑 | 验证 H5 端"高反馈 + 速通"的传播力 |

**Non-game inspirations**：阴阳/明暗对照的视觉母题；摄影中的正负片反转。

---

## Target Player Profile

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 12–35 |
| **Gaming experience** | 休闲到中核 |
| **Time availability** | 碎片时间，单局 5–20 分钟 |
| **Platform preference** | 手机浏览器为主，桌面其次 |
| **Current games they play** | 几何冲刺、各类 H5 跑酷/平台小游戏 |
| **What they're looking for** | 一眼上手、越玩越秀、忍不住截图分享的小游戏 |
| **What would turn them away** | 看不清状态导致"死得冤"、惩罚过重、操作复杂 |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | 无引擎——纯 Vanilla JS + Canvas 2D，单文件零依赖（符合仓库铁律） |
| **Key Technical Challenges** | 平台碰撞手感、切换时的"挤压"判定与公平化、移动端虚拟按键手感 |
| **Art Style** | 程序化绘制的纯色块/几何图形，光暗双色强对比 |
| **Art Pipeline Complexity** | Low（零外部图片，全部代码绘制） |
| **Audio Needs** | Minimal（WebAudio 程序合成音效，零音频文件） |
| **Networking** | None |
| **Content Volume** | MVP 5 关；完整愿景 ~15 关 + 速通/全收集 |
| **Procedural Systems** | 无（手工字符网格关卡） |

---

## Risks and Open Questions

### Design Risks
- 双世界叠加图可能让新手"看花眼" → 用稳定配色（光=暖金、暗=冷青）+ 幽灵轮廓降低认知负荷。
- 切换"挤压死"若太频繁会让人觉得冤 → 默认尝试把玩家顶出，无法解出才判死。

### Technical Risks
- 移动端虚拟按键的跳跃/切换手感 → 大按钮 + 多键位 + 视觉反馈。
- 不同分辨率下视野一致性 → 固定可见行数、按高度缩放。

### Market Risks
- 平台跳跃在 H5 端竞品多 → 用"双世界切换"这一强视觉钩子做差异化。

### Scope Risks
- 关卡要同时为两个世界设计，设计成本高 → 用字符网格关卡格式降本，先做 5 关 MVP。

### Open Questions
- 切换"挤压"到底判死还是顶出？→ MVP 先做"优先顶出，解不出才死"，靠试玩定。
- 是否需要敌人？→ MVP 用静态尖刺验证核心，敌人留待扩展。

---

## MVP Definition

**Core hypothesis**：玩家会觉得"看穿双世界 + 精准硬切"的 30 秒循环本身就好玩、且愿意为通关一次次重试。

**Required for MVP**：
1. 全操控平台物理（移动、可变高度跳跃、碰撞、coyote time/jump buffer 手感）
2. 瞬时硬切双世界（仅激活世界实体，非激活世界幽灵轮廓 + 切换汁感反馈）
3. 检查点 + 秒重生 + 死亡/计时 HUD
4. 5 个手工关 + 终点旗 + 沿途宝石
5. 移动端虚拟按键 + 键盘双支持

**Explicitly NOT in MVP**：
- 敌人 AI、移动平台、剧情、关卡编辑器、在线排行榜、皮肤。

### Scope Tiers

| Tier | Content | Features | Timeline |
| ---- | ---- | ---- | ---- |
| **MVP** | 5 关 | 核心循环 + 检查点 + 本地最佳时间 | ~1–2 周 |
| **Vertical Slice** | 1 个打磨章节 | 核心 + 全收集 + 完整汁感 | +1 周 |
| **Alpha** | ~12 关含新花样 | 移动平台、世界专属尖刺/敌人 | +2 周 |
| **Full Vision** | ~15 关 + 挑战关 | 速通成就、分享截图、关卡选择 | +2 周 |

---

## Next Steps

- [x] 头脑风暴并锁定概念（本文档）
- [ ] 直接构建单文件 MVP：`games/twin-worlds/index.html`
- [ ] 试玩验证核心循环手感（切换时机是否好玩、死亡是否"不冤"）
- [ ] 若 PROCEED：扩展关卡数量与世界专属花样（移动平台/敌人）
- [ ] 加速通成就与分享截图
