# Entity Inventory: 冰箱爆仓了

> **Status**: MVP Inventory Complete
> **Last Updated**: 2026-06-22
> **Source**: `design/gdd/food-config.md`, `design/art/art-bible.md`, `games/fridge-overflow/src/config.js`

## Food Entities

| ID | Display Name | Footprint | Unlock | Production Status | Visual Rule |
|----|--------------|-----------|--------|-------------------|-------------|
| `tea` | 奶茶 | `1x1` | 0s | Implemented | compact cup color block |
| `leftover` | 剩菜盒 | `1x1` | 0s | Implemented | square lunch-box block |
| `egg` | 鸡蛋盒 | `2x1` | 0s | Implemented | horizontal carton |
| `pizza` | 披萨盒 | `2x1` | 0s | Implemented | warm flat box |
| `gift` | 年货礼盒 | `1x2` | 0s | Implemented | vertical gift pack |
| `pot` | 汤锅 | `2x2` | 20s | Implemented | bulky block |
| `fish` | 冻鱼 | `3x1` | 40s | Implemented | long wrapped fish |

## UI Entities

| Entity | Status | Notes |
|--------|--------|-------|
| Board grid | Implemented | `6x8`, CSS grid with preview states |
| Current food ghost | Implemented | follows pointer with offset |
| Pressure meter | Implemented | gradient plus hatch danger state |
| Timer meter | Implemented | live countdown fill |
| Pending slots | Implemented | 3-slot visual counter |
| Result card | Implemented | title, index text, stats, restart, share |
| Share fallback | Implemented | Web Share or clipboard/status fallback |

## Deferred Entities

- Final bitmap food icons.
- Audio cues and haptics.
- Result-card export image.
- Theme skins and collection visuals.
