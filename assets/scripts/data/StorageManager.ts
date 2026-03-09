// assets/scripts/data/StorageManager.ts
import { Singleton } from "../core/Singleton";
import { GameData } from "./GameData";

// 全游戏唯一的仓库管理员诞生了！
export class StorageManager extends Singleton<StorageManager> {
    
    // 私有属性：藏在管理员保险柜里的“真实总账本”
    private _gameData: GameData | null = null;
    
    // 存档的暗号（存在浏览器硬盘里的名字）
    private readonly SAVE_KEY = "FarmMatch_Save_v1";

    /**
     * 公开窗口：外面的人想看数据，必须通过这个 get 窗口
     */
    public get data(): GameData {
        // 如果目前手里没账本（游戏刚开），就赶紧去硬盘里读档
        if (!this._gameData) {
            this.load(); 
        }
        // 这里的 ! 是告诉电脑“放心，执行过 load 之后，肯定有账本了”
        return this._gameData!; 
    }

    /**
     * 动作：读档（从浏览器保险箱里拿数据）
     */
    public load(): void {
        // 1. 去浏览器的缓存里找我们的暗号
        const localStr = localStorage.getItem(this.SAVE_KEY);

        if (localStr) {
            // 2. 如果找到了，就把压缩好的字符串，解压回我们的 GameData 实体
            try {
                this._gameData = JSON.parse(localStr);
                console.log("读档成功！欢迎回来，农场主！", this._gameData);
            } catch (e) {
                // 如果有人恶意修改缓存导致数据损坏，就直接发个新账本
                this._gameData = new GameData();
            }
        } else {
            // 3. 如果没找到（新玩家第一次玩），发一个全新的总账本
            console.log("新玩家注册，发放初始账本！");
            this._gameData = new GameData();
        }
    }

    /**
     * 动作：存档（把目前手里的账本存进浏览器）
     */
    public save(): void {
        if (this._gameData) {
            // 把实体账本压缩成一段纯文本字符串，锁进浏览器的保险柜
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this._gameData));
            console.log("游戏进度已保存！");
        }
    }
}