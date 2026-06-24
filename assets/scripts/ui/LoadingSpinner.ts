// assets/scripts/ui/LoadingSpinner.ts
import { _decorator, Component, tween, Tween } from 'cc';
const { ccclass } = _decorator;

/**
 * 无限旋转加载动画组件
 * 在节点激活时自动开始旋转，隐藏时停止
 */
@ccclass('LoadingSpinner')
export class LoadingSpinner extends Component {

    /** 是否正在旋转（防止重复开启动画） */
    private _isSpinning: boolean = false;

    /** 节点激活时自动开始旋转 */
    onEnable() {
        this.startSpin();
    }

    /** 节点隐藏时停止旋转 */
    onDisable() {
        this.stopSpin();
    }

    /**
     * 开始无限旋转动画
     */
    public startSpin() {
        if (this._isSpinning) return;
        this._isSpinning = true;

        // 通过 Tween 修改 eulerAngles.z 实现循环旋转
        tween(this.node)
            .by(3.0, { angle: -360 })
            .repeatForever()
            .start();
    }

    /**
     * 停止旋转并清理动画
     */
    public stopSpin() {
        this._isSpinning = false;
        Tween.stopAllByTarget(this.node);
    }
}