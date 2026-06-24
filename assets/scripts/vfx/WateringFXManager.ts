// assets/scripts/vfx/WateringFXManager.ts
import { _decorator, Component, Node, Vec3, tween, instantiate, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 浇水动画特效管理器
 * 控制水壶渐入、倾斜、水滴连发、回正、淡出的完整序列
 */
@ccclass('WateringFXManager')
export class WateringFXManager extends Component {

    @property({ type: Node, tooltip: "水壶节点" })
    public kettleNode: Node | null = null;

    @property({ type: Node, tooltip: "水滴预制体模具节点" })
    public waterDropMock: Node | null = null;

    /**
     * 播放完整的浇水动画
     */
    public playWateringSequence() {
        if (!this.kettleNode || !this.waterDropMock) return;

        this._resetWateringFX();

        const kettleOpacity = this.kettleNode.getComponent(UIOpacity) || this.kettleNode.addComponent(UIOpacity);
        this.kettleNode.active = true;
        kettleOpacity.opacity = 0;
        this.kettleNode.angle = 0;

        // 水壶淡入
        tween(kettleOpacity)
            .to(0.5, { opacity: 255 })
            .start();

        // 水壶动作主轴：淡入后倾斜、倒水、回正、淡出
        tween(this.kettleNode)
            .delay(0.5)
            .to(0.5, { angle: 45 }, { easing: 'cubicInOut' })
            .call(() => {
                this._startDropletLoop(this.waterDropMock!, 3);
            })
            .delay(1.0)
            .to(1.0, { angle: 0 }, { easing: 'fade' })
            .call(() => {
                tween(kettleOpacity)
                    .to(0.5, { opacity: 0 })
                    .call(() => {
                        this._resetWateringFX();
                    })
                    .start();
            })
            .start();
    }

    /**
     * 循环生成水滴
     * @param mockNode 水滴模具节点
     * @param count 水滴数量
     */
    private _startDropletLoop(mockNode: Node, count: number) {
        for (let i = 0; i < count; i++) {
            this.scheduleOnce(() => {
                const tempDrop = instantiate(mockNode);
                mockNode.parent!.addChild(tempDrop);

                const dropOpacity = tempDrop.getComponent(UIOpacity) || tempDrop.addComponent(UIOpacity);
                tempDrop.active = true;
                dropOpacity.opacity = 255;
                tempDrop.scale = new Vec3(0.5, 0.5, 1);

                const targetPos = new Vec3(tempDrop.position.x - 40, tempDrop.position.y - 40, 0);

                // 水滴移动并放大
                tween(tempDrop)
                    .to(0.3, { position: targetPos, scale: new Vec3(1.2, 1.2, 1) }, { easing: 'sineOut' })
                    .start();

                // 水滴淡出并销毁
                tween(dropOpacity)
                    .to(0.3, { opacity: 0 }, { easing: 'fade' })
                    .call(() => {
                        tempDrop.destroy();
                    })
                    .start();
            }, i * 0.3);
        }
    }

    /**
     * 重置所有特效状态（隐藏水壶和水滴模具）
     */
    private _resetWateringFX() {
        if (this.kettleNode) {
            this.kettleNode.active = false;
            this.kettleNode.angle = 0;
        }
        if (this.waterDropMock) {
            this.waterDropMock.active = false;
        }
    }
}