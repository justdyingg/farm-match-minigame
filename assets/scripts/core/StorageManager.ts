// assets/scripts/core/StorageManager.ts
import { sys } from 'cc';
import { GameData } from '../data/GameData';
import { Singleton } from './Singleton';

/**
 * 本地存储管理器
 * 负责游戏数据的持久化存取，基于 sys.localStorage 实现
 */
export class StorageManager extends Singleton {

    /** 内存中的游戏数据实体 */
    public gameData: GameData;

    /** 本地存储的键名，防止与其他小游戏冲突 */
    private readonly STORAGE_KEY = 'FarmMatch_SaveData_v1';

    constructor() {
        super();
        this.gameData = new GameData();
    }

    /**
     * 读取本地存档
     * 游戏启动时调用，数据损坏则自动重置
     */
    public load() {
        const dataStr = sys.localStorage.getItem(this.STORAGE_KEY);
        if (dataStr) {
            try {
                const parsedData = JSON.parse(dataStr);
                Object.assign(this.gameData, parsedData);
                console.log("📥 读档成功！当前背包数据：", this.gameData.inventory);
            } catch (e) {
                console.error("❌ 存档数据损坏，初始化新存档！", e);
                this.save();
            }
        } else {
            console.log("🆕 欢迎新玩家，创建初始存档！");
            this.save();
        }
    }

    /**
     * 保存当前数据到本地
     * 每次数据变化后调用
     */
    public save() {
        const dataStr = JSON.stringify(this.gameData);
        sys.localStorage.setItem(this.STORAGE_KEY, dataStr);
    }

    /**
     * 向背包添加种子
     * @param seedType 种子类型（花朵枚举值）
     * @param amount 添加数量
     */
    public addSeed(seedType: number, amount: number) {
        if (!this.gameData.inventory[seedType]) {
            this.gameData.inventory[seedType] = 0;
        }
        this.gameData.inventory[seedType] += amount;
        this.save();
    }
}