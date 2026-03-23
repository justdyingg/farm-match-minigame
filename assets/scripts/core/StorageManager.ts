import { sys } from 'cc';
import { GameData } from '../data/GameData';

/**
 * 本地存储管理器 (Core层)
 * 负责游戏数据的存取与持久化
 */
export class StorageManager {
    private static _instance: StorageManager;

    // 内存中的数据实体
    public gameData: GameData;

    // 存在本地硬盘里的专属钥匙（防止和其他小游戏冲突）
    private readonly STORAGE_KEY = 'FarmMatch_SaveData_v1';

    private constructor() {
        this.gameData = new GameData();
    }

    // 单例模式获取实例
    public static getInstance(): StorageManager {
        if (!this._instance) {
            this._instance = new StorageManager();
        }
        return this._instance;
    }

    /**
     * 【读档】：游戏启动时调用
     */
    public load() {
        let dataStr = sys.localStorage.getItem(this.STORAGE_KEY);
        if (dataStr) {
            try {
                let parsedData = JSON.parse(dataStr);
                // 使用 Object.assign 将本地数据合并到当前实例中
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
     * 【存档】：每次数据变化时调用
     */
    public save() {
        let dataStr = JSON.stringify(this.gameData);
        sys.localStorage.setItem(this.STORAGE_KEY, dataStr);
    }

    /**
     * 【业务接口】：往背包里添加战利品/种子
     */
    public addSeed(seedType: number, amount: number) {
        if (!this.gameData.inventory[seedType]) {
            this.gameData.inventory[seedType] = 0;
        }
        this.gameData.inventory[seedType] += amount;
        this.save(); // 拿到东西立刻存盘
    }
}