// assets/scripts/vfx/CoinFlyEffect.ts
import { _decorator, Component, Prefab, instantiate, tween, Vec3, Node, find, Tween, CCFloat, CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CoinFlyEffect')
export class CoinFlyEffect extends Component {
    @property(Prefab)
    public coinPrefab: Prefab | null = null;

    @property(Node)
    public targetNode: Node | null = null;

    @property({ type: CCInteger, tooltip: "生成金币数量" })
    public coinCount: number = 8;

    @property({ type: CCFloat, tooltip: "散开半径" })
    public radius: number = 80;

    @property({ type: CCFloat, tooltip: "散开动画时长 (秒)" })
    public scatterDuration: number = 0.5;

    @property({ type: CCFloat, tooltip: "金币直线飞行速度 (像素/秒)" })
    public flySpeed: number = 1200;

    // 存储目标节点的初始缩放
    private _targetOriginalScale: Vec3 | null = null;

    onLoad() {
        if (this.targetNode) {
            this._targetOriginalScale = this.targetNode.scale.clone();
        }
    }

    /**
     * 播放入口
     * @param startWorldPos 土地节点的世界坐标，作为金币初始生成点
     */
    public play(startWorldPos: Vec3) {
        if (!this.coinPrefab || !this.targetNode) return;

        const targetWorldPos = this.targetNode.getWorldPosition();

        for (let i = 0; i < this.coinCount; i++) {
            // 随机计算散开后的终点位置
            const angle = Math.random() * Math.PI * 2;
            const dist = this.radius * (0.5 + Math.random() * 0.5);
            const offsetX = Math.cos(angle) * dist;
            const offsetY = Math.sin(angle) * dist;
            const scatteredPos = new Vec3(
                startWorldPos.x + offsetX,
                startWorldPos.y + offsetY,
                startWorldPos.z
            );

            // 创建金币节点，初始位于土地中心
            const coinNode = instantiate(this.coinPrefab);
            const canvas = find('Canvas');
            if (canvas) {
                canvas.addChild(coinNode);
            } else {
                this.node.parent?.addChild(coinNode);
            }
            coinNode.setWorldPosition(startWorldPos);

            // 计算飞行阶段时长（距离 ÷ 速度）
            const flyDistance = Vec3.distance(scatteredPos, targetWorldPos);
            const flyDuration = flyDistance / this.flySpeed;

            // 动画序列：散开 → 停留 1 秒 → 直线飞向目标 → 数字弹跳 → 销毁
            tween(coinNode)
                .to(this.scatterDuration, { worldPosition: scatteredPos }, { easing: 'sineOut' })
                .delay(1.0)
                .to(flyDuration, { worldPosition: targetWorldPos }, { easing: 'linear' })
                .call(() => {
                    this._playNumberJump();
                    coinNode.destroy();
                })
                .start();
        }
    }

    /**
     * 播放目标节点的弹跳反馈（短暂放大后恢复）
     */
    private _playNumberJump() {
        if (!this.targetNode || !this._targetOriginalScale) return;

        // 停止节点上已有的动画，防止冲突
        Tween.stopAllByTarget(this.targetNode);

        // 基于初始缩放计算放大后的值（例如放大到 1.3 倍）
        const bigScale = new Vec3(
            this._targetOriginalScale.x * 1.3,
            this._targetOriginalScale.y * 1.3,
            1
        );

        // 动画：先放大，再恢复到初始缩放
        tween(this.targetNode)
            .to(0.1, { scale: bigScale }, { easing: 'sineOut' })
            .to(0.1, { scale: this._targetOriginalScale }, { easing: 'sineIn' })
            .start();
    }
}