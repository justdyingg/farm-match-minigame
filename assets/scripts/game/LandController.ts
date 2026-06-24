// assets/scripts/game/LandController.ts
import { _decorator, Component, Node, Sprite, SpriteFrame, Color, Label, find, Vec3, AudioClip } from 'cc';
import { DialogManager } from '../ui/DialogManager';
import { CoinFlyEffect } from '../vfx/CoinFlyEffect';
import { LandData, LandState } from '../data/LandData';
import { StorageManager } from '../core/StorageManager';
import { WateringFXManager } from '../vfx/WateringFXManager';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

/**
 * 单块土地控制器
 * 负责土地的全生命周期管理：解锁、播种、浇水、生长、收获
 */
@ccclass('LandController')
export class LandController extends Component {

    // ==================== 编辑器绑定属性 ====================

    @property({ type: Node, tooltip: "缺水时头顶出现的水滴图标" })
    public waterIcon: Node | null = null;

    @property({ type: SpriteFrame, tooltip: "土地未解锁时的图片" })
    public lockedSkin: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: "土地为空时的图片" })
    public emptySkin: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: "植物生长中（幼苗或花苞）的土地图片" })
    public growingSkin: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: "植物成熟可收获时的土地图片" })
    public harvestableSkin: SpriteFrame | null = null;

    @property({ type: Node, tooltip: "点击空地时弹出的操作气泡（播种按钮等）" })
    public actionBubble: Node | null = null;

    @property({ type: Sprite, tooltip: "显示植物幼苗/花苞/成熟花朵的图片组件" })
    public plantSprite: Sprite | null = null;

    @property({ type: SpriteFrame, tooltip: "幼苗阶段的通用植物图片" })
    public seedlingSkin: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: "花苞阶段的通用植物图片" })
    public budSkin: SpriteFrame | null = null;

    @property({ type: [SpriteFrame], tooltip: "4种成熟花朵的图片数组，索引0-3对应雏菊、向日葵、郁金香、薰衣草" })
    public matureFlowerSkins: SpriteFrame[] = [];

    @property({ type: AudioClip, tooltip: "点击按钮的反馈音效" })
    public clickSound: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: "点击土地的反馈音效" })
    public landSound: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: "植物成长的反馈音效" })
    public growSound: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: "浇水土地的反馈音效" })
    public waterSound: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: "收获土地的反馈音效" })
    public harvestSound: AudioClip | null = null;

    // ==================== 内部状态 ====================

    /** 当前土地的数据档案 */
    private landData: LandData | null = null;

    /** 每个生长阶段的时长（毫秒） */
    private readonly GROW_TIME_MS = 5000;

    /** 解锁土地所需金币价格表（第3块到第9块） */
    private readonly UNLOCK_PRICES: number[] = [0, 0, 50, 150, 350, 750, 1500, 2500, 4000];

    /** 农场管理器引用 */
    private farmManager: any = null;

    // ==================== 初始化 ====================

    /**
     * 初始化土地
     * @param data 土地数据档案
     * @param manager 农场管理器实例
     */
    public init(data: LandData, manager: any) {
        this.landData = data;
        this.farmManager = manager;
        this.updateView();
        // 每秒检查一次生长状态
        this.schedule(this.checkGrowth, 1.0);
    }

    // ==================== 生长逻辑 ====================

    /**
     * 定时检查植物是否需要进入下一生长阶段
     */
    private checkGrowth() {
        if (!this.landData) return;

        if ((this.landData.state === LandState.SEEDLING || this.landData.state === LandState.BUD)
            && !this.landData.needsWater) {
            if (Date.now() >= this.landData.nextStageTime) {
                this.growToNextStage();
            }
        }
    }

    /**
     * 进入下一个生长阶段
     */
    private growToNextStage() {
        if (this.landData!.state === LandState.SEEDLING) {
            this.landData!.state = LandState.BUD;
            this.landData!.needsWater = true;
        } else if (this.landData!.state === LandState.BUD) {
            this.landData!.state = LandState.BLOOMING;
        }
        if (this.growSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.growSound);
        }
        StorageManager.getInstance(StorageManager).save();
        this.updateView();
    }

    // ==================== 玩家交互 ====================

    /**
     * 玩家点击土地时的总控逻辑
     * 根据当前状态执行不同操作
     */
    public triggerClick() {
        if (!this.landData) return;

        const manager = StorageManager.getInstance(StorageManager);

        switch (this.landData.state) {
            case LandState.LOCKED:
                this._handleLockedClick(manager);
                break;

            case LandState.EMPTY:
                if (this.landSound) {
                    AudioManager.getInstance(AudioManager).playSFX(this.landSound);
                }
                if (this.actionBubble) {
                    this.actionBubble.active = !this.actionBubble.active;
                }
                break;

            case LandState.SEEDLING:
            case LandState.BUD:
                this._handleWateringClick();
                break;

            case LandState.BLOOMING:
                this._handleHarvestClick(manager);
                break;
        }

        this.updateView();
    }

    /** 处理未解锁土地的点击：弹出解锁确认对话框 */
    private _handleLockedClick(manager: StorageManager) {
        const price = this.UNLOCK_PRICES[this.landData!.id];
        const dialogMgr = find('Canvas/DialogManager')?.getComponent(DialogManager);

        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }

        if (!dialogMgr) return;

        dialogMgr.showConfirm(
            '解锁土地',
            `解锁这块地需要花费 ${price} 金币`,
            () => {
                if (manager.gameData.coins >= price) {
                    manager.gameData.coins -= price;
                    this.landData!.state = LandState.EMPTY;
                    if (this.harvestSound) {
                        AudioManager.getInstance(AudioManager).playSFX(this.harvestSound);
                    }
                    manager.save();
                    this.updateView();
                    if (this.farmManager) {
                        this.farmManager.refreshUI();
                    }
                } else {
                    dialogMgr.showAlert('金币不足', `解锁需要 ${price} 金币，当前只有 ${manager.gameData.coins} 金币。`);
                }
            }
        );
    }

    /** 处理缺水状态的点击：执行浇水 */
    private _handleWateringClick() {
        if (!this.landData!.needsWater) return;

        this.landData!.needsWater = false;
        this.landData!.nextStageTime = Date.now() + this.GROW_TIME_MS;
        StorageManager.getInstance(StorageManager).save();

        this.updateView();

        const fxMgr = this.getComponent(WateringFXManager);
        if (fxMgr) {
            fxMgr.playWateringSequence();
        }
        if (this.waterSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.waterSound);
        }
    }

    /** 处理开花状态的点击：收获花朵 */
    private _handleHarvestClick(manager: StorageManager) {
        let yieldCoins = 0;
        const plantedType = this.landData!.plantedType;

        // 根据花朵类型随机产出金币
        if (plantedType === 0) yieldCoins = Math.floor(Math.random() * 9) + 1;       // 雏菊期望 5
        else if (plantedType === 1) yieldCoins = Math.floor(Math.random() * 9) + 6;  // 向日葵期望 10
        else if (plantedType === 2) yieldCoins = Math.floor(Math.random() * 9) + 11; // 郁金香期望 15
        else if (plantedType === 3) yieldCoins = Math.floor(Math.random() * 9) + 16; // 薰衣草期望 20

        manager.gameData.coins += yieldCoins;
        if (this.harvestSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.harvestSound);
        }

        // 土地恢复为空地
        this.landData!.state = LandState.EMPTY;
        this.landData!.plantedType = -1;

        if (this.farmManager) {
            this.farmManager.refreshUI();
        }

        // 播放金币飞出特效
        const effectMgrNode = find('Canvas/EffectManager');
        if (effectMgrNode) {
            const coinFly = effectMgrNode.getComponent(CoinFlyEffect);
            if (coinFly) {
                coinFly.play(this.node.getWorldPosition());
            }
        }

        manager.save();
    }

    // ==================== 外部调用接口 ====================

    /** 气泡按钮点击：通知农场管理器打开种子背包 */
    public onBubbleClicked() {
        if (this.farmManager) {
            this.farmManager.openSeedPanel(this);
        }
    }

    /** 隐藏操作气泡 */
    public hideBubble() {
        if (this.actionBubble) this.actionBubble.active = false;
    }

    /**
     * 执行播种
     * @param seedType 种子类型编号
     */
    public plantSpecificSeed(seedType: number) {
        if (!this.landData) return;

        this.landData.state = LandState.SEEDLING;
        this.landData.plantedType = seedType;
        this.landData.needsWater = true;
        this.landData.nextStageTime = 0;

        this.hideBubble();
        this.updateView();
        StorageManager.getInstance(StorageManager).save();
    }

    // ==================== 视觉刷新 ====================

    /**
     * 根据当前土地状态刷新视觉表现
     */
    public updateView() {
        if (!this.landData) return;

        const baseSprite = this.getComponent(Sprite);
        if (!baseSprite) return;

        switch (this.landData.state) {
            case LandState.LOCKED:
                if (this.lockedSkin) baseSprite.spriteFrame = this.lockedSkin;
                if (this.plantSprite) this.plantSprite.node.active = false;
                if (this.waterIcon) this.waterIcon.active = false;
                break;

            case LandState.EMPTY:
                if (this.emptySkin) baseSprite.spriteFrame = this.emptySkin;
                if (this.plantSprite) this.plantSprite.node.active = false;
                if (this.waterIcon) this.waterIcon.active = false;
                break;

            case LandState.SEEDLING:
                if (this.growingSkin) baseSprite.spriteFrame = this.growingSkin;
                if (this.plantSprite) {
                    this.plantSprite.node.active = true;
                    this.plantSprite.spriteFrame = this.seedlingSkin;
                    this.plantSprite.node.scale = new Vec3(0.5, 0.5, 1);
                }
                if (this.waterIcon) this.waterIcon.active = this.landData.needsWater;
                break;

            case LandState.BUD:
                if (this.growingSkin) baseSprite.spriteFrame = this.growingSkin;
                if (this.plantSprite) {
                    this.plantSprite.node.active = true;
                    this.plantSprite.spriteFrame = this.budSkin;
                    this.plantSprite.node.scale = new Vec3(0.4, 0.4, 1);
                }
                if (this.waterIcon) this.waterIcon.active = this.landData.needsWater;
                break;

            case LandState.BLOOMING:
                if (this.harvestableSkin) baseSprite.spriteFrame = this.harvestableSkin;
                if (this.plantSprite) {
                    this.plantSprite.node.active = true;
                    this.plantSprite.node.scale = new Vec3(0.6, 0.6, 1);
                    const typeId = this.landData.plantedType;
                    if (this.matureFlowerSkins[typeId]) {
                        this.plantSprite.spriteFrame = this.matureFlowerSkins[typeId];
                    }
                }
                if (this.waterIcon) this.waterIcon.active = false;
                break;
        }
    }
}