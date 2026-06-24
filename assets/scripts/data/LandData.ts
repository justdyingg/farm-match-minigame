// assets/scripts/data/LandData.ts

/**
 * 土地状态枚举
 * 定义每块土地在生长周期中可能处于的所有状态
 */
export enum LandState {
    LOCKED = -1,    // 未解锁，需要花费金币
    EMPTY = 0,      // 空地，可以播种
    SEEDLING = 1,   // 幼苗期，需要浇水
    BUD = 2,        // 花苞期，需要浇水
    BLOOMING = 3    // 开花期，可以收获
}

/**
 * 单块土地的数据档案
 * 记录土地编号、当前状态、种植的花种和生长进度
 */
export class LandData {
    /** 土地编号（0-8，对应九宫格位置） */
    public id: number;

    /** 当前所处的生长状态 */
    public state: LandState;

    /** 当前种植的花朵类型（-1 表示未种植，0-雏菊, 1-向日葵, 2-郁金香, 3-薰衣草） */
    public plantedType: number;

    /** 当前是否需要浇水 */
    public needsWater: boolean;

    /** 到达下一生长阶段的现实时间戳（使用 Date.now()） */
    public nextStageTime: number;

    /**
     * @param id 土地编号
     * @param isUnlocked 是否初始即解锁
     */
    constructor(id: number, isUnlocked: boolean) {
        this.id = id;
        this.state = isUnlocked ? LandState.EMPTY : LandState.LOCKED;
        this.plantedType = -1;
        this.needsWater = false;
        this.nextStageTime = 0;
    }
}