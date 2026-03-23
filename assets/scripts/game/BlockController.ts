// assets/scripts/game/BlockController.ts
import { _decorator, Component, Node, Sprite, Color } from 'cc';
// 导入咱们刚才精心设计的绝密档案图纸
import { BlockData, BlockType } from '../data/BlockData';
import { Singleton } from '../core/Singleton';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

@ccclass('BlockController')
export class BlockController extends Component {

    // 大脑里的记忆中枢：专门用来存放 GameManager 拍在它脸上的那份档案
    public blockData: BlockData | null = null;

    /**
     * 觉醒仪式：当 GameManager 在流水线上调用这个方法时，方块正式被激活！
     */
    public init(data: BlockData) {
        this.blockData = data; // 1. 记住自己的档案

        // 2. 开启触摸雷达，监听玩家的手指点击
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);

        // 3. 呼叫内部换衣程序，根据档案给自己上色
        this.updateView();
    }

    /**
     * 自动换装系统
     */
    private updateView() {
        // 自己动手，扒下自己身上的 Sprite（画图）衣服
        let sprite = this.getComponent(Sprite);

        // 如果衣服没丢，且档案没弄丢
        if (sprite && this.blockData) {
            // 根据档案上的品种代号，染上对应的颜色
            switch (this.blockData.type) {
                case BlockType.DAISY:      // 雏菊 -> 白色
                    sprite.color = new Color(255, 255, 255);
                    break;
                case BlockType.SUNFLOWER:  // 向日葵 -> 黄色
                    sprite.color = new Color(255, 255, 0);
                    break;
                case BlockType.TULIP:      // 郁金香 -> 粉红
                    sprite.color = new Color(255, 100, 100);
                    break;
                case BlockType.LAVENDER:   // 薰衣草 -> 紫色
                    sprite.color = new Color(150, 100, 255);
                    break;
            }
        }
    }

    /**
     * 被点击时的神经反射
     */
    private onClick() {
        // 1. 自己先嘀咕一句
        console.log(`⚡ 哎哟！我是 (${this.blockData!.x}, ${this.blockData!.y}) 的方块！`);

        // 2. 【极其帅气的一步】：拿起对讲机，连接全局广播站，大喊一声！
        // 频道暗号叫："EVENT_BLOCK_CLICKED"
        // 顺手把自己脑子里的那份《绝密档案》作为附件，顺着电波一起扔出去！
        Singleton.getInstance(EventManager).emit("EVENT_BLOCK_CLICKED", this.blockData);
    }
}