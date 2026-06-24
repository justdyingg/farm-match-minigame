// assets/scripts/data/BlockData.ts

/**
 * 花朵类型枚举
 * 定义游戏中所有合法的花朵种类
 */
export enum BlockType {
    DAISY = 0,      // 雏菊
    SUNFLOWER = 1,  // 向日葵
    TULIP = 2,      // 郁金香
    LAVENDER = 3    // 薰衣草
}

/** 花朵基础配置表，按类型索引获取名称、价格、描述等信息 */
export const FlowerConfig = {
    [BlockType.DAISY]: { name: "雏菊", price: 10, desc: "一朵洁白的小花" },
    [BlockType.SUNFLOWER]: { name: "向日葵", price: 25, desc: "永远向着太阳" },
    [BlockType.TULIP]: { name: "郁金香", price: 50, desc: "华丽的春季花朵" },
    [BlockType.LAVENDER]: { name: "薰衣草", price: 80, desc: "散发着迷人的香气" }
};

/**
 * 方块数据结构
 * 记录单个方块在棋盘上的坐标和花朵类型
 */
export class BlockData {
    /** 棋盘横坐标（列） */
    public x: number;

    /** 棋盘纵坐标（行） */
    public y: number;

    /** 花朵类型（0-雏菊, 1-向日葵, 2-郁金香, 3-薰衣草） */
    public type: BlockType;

    /**
     * @param x 横坐标
     * @param y 纵坐标
     * @param type 花朵类型
     */
    constructor(x: number, y: number, type: BlockType) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}