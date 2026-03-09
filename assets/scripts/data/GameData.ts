// assets/scripts/data/GameData.ts

// 1. 玩家的基础属性账本
export class PlayerData {
    public coins: number = 0;      // 金币
    public stamina: number = 30;   // 体力（三消需要消耗体力）
}

// 2. 玩家的背包账本
export class InventoryData {
    // 用一个字典 (Key 是字符串，Value 是数字) 来存种子数量
    // 默认给玩家几颗初始种子体验一下
    public seeds: { [key: string]: number } = {
        "daisy": 5,       // 雏菊种子
        "sunflower": 2,   // 向日葵种子
        "tulip": 0,       // 郁金香种子
        "lavender": 0     // 薰衣草种子
    }; 
}

// 3. 农场土地账本
export class FarmData {
    // 假设我们有 6 块地。
    // 0代表未解锁，1代表空闲可以种，2代表正在长...
    public lands: number[] = [1, 1, 1, 0, 0, 0]; 
}

// 4. 总账本！把上面三个小账本汇总到一个大本子里
export class GameData {
    public player: PlayerData = new PlayerData();
    public inventory: InventoryData = new InventoryData();
    public farm: FarmData = new FarmData();
}