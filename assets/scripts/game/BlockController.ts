// assets/scripts/game/BlockController.ts
import { _decorator, Component, Node, Sprite, Color } from 'cc';
import { BlockData, BlockType } from '../data/BlockData';
import { Singleton } from '../core/Singleton';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

/**
 * 单个方块的控制器
 * 负责方块的视觉渲染和点击事件的广播
 */
@ccclass('BlockController')
export class BlockController extends Component {

    /** 当前方块关联的数据档案（坐标与类型） */
    public blockData: BlockData | null = null;

    /**
     * 初始化方块
     * @param data 方块的坐标与类型数据
     */
    public init(data: BlockData) {
        this.blockData = data;
        // 监听手指点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
        // 根据类型更新颜色
        this.updateView();
    }

    /**
     * 根据方块类型更新 Sprite 的渲染颜色
     */
    private updateView() {
        const sprite = this.getComponent(Sprite);
        if (!sprite || !this.blockData) return;

        switch (this.blockData.type) {
            case BlockType.DAISY:      // 雏菊 → 白色
                sprite.color = new Color(255, 255, 255);
                break;
            case BlockType.SUNFLOWER:  // 向日葵 → 黄色
                sprite.color = new Color(255, 255, 0);
                break;
            case BlockType.TULIP:      // 郁金香 → 粉红
                sprite.color = new Color(255, 100, 100);
                break;
            case BlockType.LAVENDER:   // 薰衣草 → 紫色
                sprite.color = new Color(150, 100, 255);
                break;
        }
    }

    /**
     * 处理点击事件，通过全局事件系统广播方块被点击的消息
     */
    private onClick() {
        console.log(`⚡ 方块被点击：(${this.blockData!.x}, ${this.blockData!.y})`);
        Singleton.getInstance(EventManager).emit("EVENT_BLOCK_CLICKED", this.blockData);
    }
}