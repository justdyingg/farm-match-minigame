// assets/scripts/game/FarmManager.ts
import { _decorator, Component, Node, Label, director, Prefab, instantiate, EventTouch, UITransform, Vec3, ScrollView, AudioClip, CCFloat } from 'cc';
import { StorageManager } from '../core/StorageManager';
import { LandController } from './LandController';
import { BlockType, FlowerConfig } from '../data/BlockData';
import { SeedSlotController } from './SeedSlotController';
import { SpriteNumberLabel } from '../ui/SpriteNumberLabel';
import { AudioManager } from '../core/AudioManager';
import { WeatherManager } from '../api/WeatherManager';
const { ccclass, property } = _decorator;

/**
 * 农场大厅管理器
 * 负责农场场景的初始化、土地管理、背包系统和天气功能
 */
@ccclass('FarmManager')
export class FarmManager extends Component {

    // ==================== 编辑器绑定属性 ====================

    @property({ type: AudioClip, tooltip: "通用点击音效" })
    public clickSound: AudioClip | null = null;

    @property({ type: SpriteNumberLabel, tooltip: "金币数字显示组件（图片拼接）" })
    public goldSpriteDisplay: SpriteNumberLabel | null = null;

    @property({ type: Label, tooltip: "背包文字显示组件" })
    public inventoryLabel: Label | null = null;

    @property({ type: Prefab, tooltip: "土地预制体" })
    public landPrefab: Prefab | null = null;

    @property({ type: Node, tooltip: "农场菱形网格托盘" })
    public farmBoard: Node | null = null;

    @property({ type: Node, tooltip: "种子背包面板" })
    public seedPanel: Node | null = null;

    @property({ type: Prefab, tooltip: "种子格子预制体" })
    public seedSlotPrefab: Prefab | null = null;

    @property({ type: Node, tooltip: "种子网格容器（ScrollView 的 content 节点）" })
    public seedGridContent: Node | null = null;

    @property({ type: ScrollView, tooltip: "种子背包滚动视图" })
    public seedScrollView: ScrollView | null = null;

    @property({ type: AudioClip, tooltip: "农场大厅背景音乐" })
    public bgmClip: AudioClip | null = null;

    @property({ type: CCFloat, tooltip: "农场 BGM 音量 (0 ~ 1)", range: [0, 1], slide: true })
    public bgmVolume: number = 0.5;

    @property({ type: Prefab, tooltip: "天气弹窗预制体" })
    public weatherPanelPrefab: Prefab | null = null;

    @property({ type: Node, tooltip: "天气按钮节点" })
    public weatherButton: Node | null = null;

    // ==================== 内部状态 ====================

    /** 所有土地控制器的引用列表 */
    public landControllers: LandController[] = [];

    /** 当前选中的土地（用于播种等操作） */
    private currentSelectedLand: LandController | null = null;

    // ==================== 生命周期 ====================

    start() {
        // 读取最新存档
        StorageManager.getInstance(StorageManager).load();

        // 初始化全局音频管理器
        const audioMgr = AudioManager.getInstance(AudioManager);
        audioMgr.init();

        // 播放农场背景音乐
        if (this.bgmClip) {
            audioMgr.playBGM(this.bgmClip, true, this.bgmVolume);
        }

        // 将天气弹窗预制体传递给 WeatherManager
        const weatherMgr = WeatherManager.getInstance(WeatherManager);
        weatherMgr.weatherPanelPrefab = this.weatherPanelPrefab;

        // 绑定天气按钮点击事件
        if (this.weatherButton) {
            this.weatherButton.on(Node.EventType.TOUCH_END, this.onWeatherButtonClick, this);
        }

        // 动态生成 9 块土地
        this.generateLands();

        // 刷新 UI 显示
        this.refreshUI();

        // 监听农场托盘的全局点击（用于菱形点击检测）
        if (this.farmBoard) {
            this.farmBoard.on(Node.EventType.TOUCH_END, this.onBoardClicked, this);
        }
    }

    // ==================== 天气按钮 ====================

    /** 天气按钮点击处理 */
    private onWeatherButtonClick() {
        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }
        WeatherManager.getInstance(WeatherManager).fetchWeather();
    }

    // ==================== 土地点击检测 ====================

    /**
     * 2.5D 菱形坐标精准点击检测
     * 遍历所有土地节点，使用等轴坐标算法判断点击位置
     */
    private onBoardClicked(event: EventTouch) {
        const uiLocation = event.getUILocation();
        const touchVec3 = new Vec3(uiLocation.x, uiLocation.y, 0);

        let hitAnyLand = false;

        // 从后向前遍历，优先响应上层土地
        for (let i = this.landControllers.length - 1; i >= 0; i--) {
            const landCtrl = this.landControllers[i];
            const uiTransform = landCtrl.node.getComponent(UITransform);
            if (!uiTransform) continue;

            const localPos = uiTransform.convertToNodeSpaceAR(touchVec3);
            const halfWidth = uiTransform.width / 2;
            const halfHeight = uiTransform.height / 2;

            // 菱形区域判定
            if (Math.abs(localPos.x / halfWidth) + Math.abs(localPos.y / halfHeight) <= 1) {
                hitAnyLand = true;

                // 如果点击了新地块，先收起旧地块的气泡
                if (this.currentSelectedLand && this.currentSelectedLand !== landCtrl) {
                    this.currentSelectedLand.hideBubble();
                }

                this.currentSelectedLand = landCtrl;
                landCtrl.triggerClick();
                break;
            }
        }

        // 点击空白区域时，收起当前气泡
        if (!hitAnyLand && this.currentSelectedLand) {
            this.currentSelectedLand.hideBubble();
            this.currentSelectedLand = null;
        }
    }

    // ==================== 土地生成 ====================

    /**
     * 动态生成 9 块土地，按 2.5D 等轴坐标排列
     */
    private generateLands() {
        if (!this.landPrefab || !this.farmBoard) return;

        const gameData = StorageManager.getInstance(StorageManager).gameData;
        const TILE_WIDTH = 240;
        const TILE_HEIGHT = 120;

        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;

            const landNode = instantiate(this.landPrefab);
            this.farmBoard.addChild(landNode);

            // 2.5D 等轴坐标转换公式
            const isoX = (col - row) * (TILE_WIDTH / 2);
            const isoY = -(col + row) * (TILE_HEIGHT / 2);

            landNode.setPosition(isoX, isoY, 0);

            const landCtrl = landNode.getComponent(LandController);
            if (landCtrl && gameData.lands[i]) {
                landCtrl.init(gameData.lands[i], this);
                this.landControllers.push(landCtrl);
            }
        }
    }

    // ==================== 种子背包 ====================

    /**
     * 打开种子背包面板（由土地气泡触发）
     * @param land 触发打开的土地控制器
     */
    public openSeedPanel(land: LandController) {
        this.currentSelectedLand = land;
        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }
        if (this.seedPanel) {
            this.seedPanel.active = true;
        }
        this.refreshSeedGrid();
        if (this.seedScrollView) {
            this.seedScrollView.scrollToTop(0);
        }
    }

    /**
     * 关闭种子背包面板
     */
    public closeSeedPanel() {
        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }
        if (this.seedPanel) {
            this.seedPanel.active = false;
        }
        if (this.currentSelectedLand) {
            this.currentSelectedLand.hideBubble();
            this.currentSelectedLand = null;
        }
    }

    /**
     * 执行播种（由种子格子点击触发）
     * @param seedType 种子类型编号
     */
    public plantSeedFromPanel(seedType: number) {
        if (!this.currentSelectedLand) return;
        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }

        const manager = StorageManager.getInstance(StorageManager);
        if (manager.gameData.inventory[seedType] > 0) {
            manager.gameData.inventory[seedType] -= 1;
            manager.save();
            this.currentSelectedLand.plantSpecificSeed(seedType);
            this.closeSeedPanel();
            this.refreshUI();
        }
    }

    /**
     * 刷新种子网格，根据背包数据动态生成格子
     */
    public refreshSeedGrid() {
        if (!this.seedGridContent || !this.seedSlotPrefab) return;

        this.seedGridContent.removeAllChildren();

        const inventory = StorageManager.getInstance(StorageManager).gameData.inventory;

        // 筛选已拥有的种子并按类型排序
        const ownedSeeds = Object.keys(inventory)
            .map(typeStr => parseInt(typeStr))
            .filter(type => inventory[type] > 0)
            .sort((a, b) => a - b);

        // 固定生成 9 个格子，有余的显示为空
        for (let i = 0; i < 9; i++) {
            const slotNode = instantiate(this.seedSlotPrefab);
            this.seedGridContent.addChild(slotNode);
            const slotCtrl = slotNode.getComponent(SeedSlotController);

            if (i < ownedSeeds.length) {
                const seedType = ownedSeeds[i];
                const count = inventory[seedType];
                if (slotCtrl) slotCtrl.init(seedType, count, this);
            } else {
                if (slotCtrl) slotCtrl.init(-1, 0, this);
            }
        }
    }

    /**
     * 独立打开背包（纯查看模式，不绑定任何土地）
     */
    public openInventoryDirectly() {
        this.currentSelectedLand = null;
        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }
        if (this.seedPanel) {
            this.seedPanel.active = true;
        }
        this.refreshSeedGrid();
        if (this.seedScrollView) {
            this.seedScrollView.scrollToTop(0);
        }
    }

    /**
     * 种子格子点击回调
     * @param seedType 种子类型编号
     */
    public onSeedSlotClicked(seedType: number) {
        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }
        if (this.currentSelectedLand) {
            this.plantSeedFromPanel(seedType);
        }
    }

    // ==================== UI 刷新 ====================

    /**
     * 刷新农场大厅的金币和种子背包显示
     */
    public refreshUI() {
        const gameData = StorageManager.getInstance(StorageManager).gameData;

        if (this.goldSpriteDisplay) {
            this.goldSpriteDisplay.string = gameData.coins.toString();
        }

        if (this.inventoryLabel) {
            let inventoryText = "【种子背包】\n";
            let hasAnySeed = false;

            for (const typeStr in gameData.inventory) {
                const count = gameData.inventory[typeStr];
                if (count > 0) {
                    hasAnySeed = true;
                    const blockType = parseInt(typeStr);
                    const flowerName = FlowerConfig[blockType]?.name || "神秘种子";
                    inventoryText += `${flowerName}: ${count} 个\n`;
                }
            }

            if (!hasAnySeed) {
                inventoryText += "空空如也，快去获取种子吧！";
            }

            this.inventoryLabel.string = inventoryText;
        }
    }

    // ==================== 场景切换 ====================

    /**
     * 跳转到三消关卡场景
     */
    public onGoToMatch3Clicked() {
        if (this.clickSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.clickSound);
        }
        director.loadScene('Match3Scene');
    }
}