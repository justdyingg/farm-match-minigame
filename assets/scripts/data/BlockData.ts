// assets/scripts/data/BlockData.ts

/**
 * 【核心资产 1：下拉菜单】
 * 规定全宇宙只有这 4 种合法的花朵，坚决防止有人手滑写错名字！
 */
export enum BlockType {
    DAISY = 0,      // 雏菊
    SUNFLOWER = 1,  // 向日葵
    TULIP = 2,      // 郁金香
    LAVENDER = 3    // 薰衣草
}

/**
 * 【核心资产 2：绝密档案图纸】
 * 这是一个纯粹的“数据结构”，用来记录每一个方块的真实身份。
 */
export class BlockData {
    public x: number; // 记录自己在哪一列 (横坐标)
    public y: number; // 记录自己在哪一行 (纵坐标)
    public type: BlockType; // 记录自己是什么品种的花

    /**
     * 【进料口 / 出厂设置】
     * 强制要求：只要你想建立一份新档案，就必须把 x, y, type 这三个印章盖齐！
     */
    constructor(x: number, y: number, type: BlockType) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}