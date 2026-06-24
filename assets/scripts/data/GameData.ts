// assets/scripts/data/GameData.ts
import { LandData } from './LandData';

/**
 * 玩家总资产数据结构
 * 包含金币、种子背包和所有土地的状态
 */
export class GameData {
    /** 当前持有的金币数量 */
    public coins: number;

    /** 种子背包：key 为花朵类型编号，value 为该类型种子的持有数量 */
    public inventory: { [key: string]: number };

    /** 9 块土地的详细数据 */
    public lands: LandData[];

    constructor() {
        this.coins = 0;
        this.inventory = {};
        this.lands = [];

        // 首次游戏时初始化 9 块土地
        for (let i = 0; i < 9; i++) {
            // 前 2 块土地默认解锁，其余需要花费金币解锁
            const isUnlocked = (i < 2);
            this.lands.push(new LandData(i, isUnlocked));
        }
    }
}