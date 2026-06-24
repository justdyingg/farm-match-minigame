// assets/scripts/game/SeedSlotController.ts
import { _decorator, Component, Node, Sprite, Label, SpriteFrame } from 'cc';
import { FarmManager } from './FarmManager';
const { ccclass, property } = _decorator;

/**
 * 种子格子控制器
 * 背包中单个种子格子的视觉显示与点击处理
 */
@ccclass('SeedSlotController')
export class SeedSlotController extends Component {

    // ==================== 编辑器绑定属性 ====================

    @property({ type: Sprite, tooltip: "种子图标组件" })
    public iconSprite: Sprite | null = null;

    @property({ type: Label, tooltip: "种子数量文字组件" })
    public countLabel: Label | null = null;

    @property({ type: [SpriteFrame], tooltip: "4种花朵种子的图标数组，索引0-3对应雏菊、向日葵、郁金香、薰衣草" })
    public seedSkins: SpriteFrame[] = [];

    // ==================== 内部状态 ====================

    /** 当前格子代表的种子类型（-1 表示空格子） */
    private seedType: number = -1;

    /** 农场管理器引用 */
    private farmManager: FarmManager | null = null;

    // ==================== 初始化 ====================

    /**
     * 初始化种子格子
     * @param type 种子类型（-1 为空格子）
     * @param count 持有数量
     * @param manager 农场管理器实例
     */
    public init(type: number, count: number, manager: FarmManager) {
        this.seedType = type;
        this.farmManager = manager;

        // 空格子：清空图标和数量，不绑定点击事件
        if (type === -1) {
            if (this.iconSprite) this.iconSprite.spriteFrame = null;
            if (this.countLabel) this.countLabel.string = "";
            return;
        }

        // 正常格子：设置图标、数量和点击事件
        if (this.countLabel) {
            this.countLabel.string = count.toString();
        }
        if (this.iconSprite && this.seedSkins[type]) {
            this.iconSprite.spriteFrame = this.seedSkins[type];
        }
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    // ==================== 交互 ====================

    /** 点击种子格子：通知农场管理器 */
    private onClick() {
        if (this.farmManager) {
            this.farmManager.onSeedSlotClicked(this.seedType);
        }
    }

    // ==================== 生命周期 ====================

    /** 节点销毁时取消事件监听，防止内存泄漏 */
    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }
}