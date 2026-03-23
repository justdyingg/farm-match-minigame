// assets/scripts/data/GameData.ts
/**
 * 玩家全局数据账本 (Model层)
 * 记录玩家的财产、最高分和背包数据
 */
export class GameData {
    public coins: number = 0;          // 玩家金币
    public maxScore: number = 0;       // 三消最高得分记录

    // 种子/花朵背包
    // key 是花朵的 BlockType 枚举数字，value 是拥有的数量
    public inventory: { [key: number]: number } = {};

    // 农场地块数据
    public farmLands: any[] = [];
}