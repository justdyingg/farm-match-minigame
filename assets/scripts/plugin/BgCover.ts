// assets/scripts/plugin/BgCover.ts
import { _decorator, Component, UITransform, view } from 'cc';
const { ccclass } = _decorator;

/**
 * 背景自适应组件
 * 通过等比缩放使背景图完全覆盖屏幕，保证不留黑边
 */
@ccclass('BgCover')
export class BgCover extends Component {

    start() {
        this.adaptBackground();
        // 监听画布尺寸变化（窗口大小改变、横竖屏切换）
        view.on('canvas-resize', this.adaptBackground, this);
    }

    /**
     * 根据屏幕可视区域与背景图原始尺寸，计算并应用最大等比缩放
     */
    private adaptBackground() {
        const uiTransform = this.getComponent(UITransform);
        if (!uiTransform) return;

        const screenSize = view.getVisibleSize();
        const bgOriginalSize = uiTransform.contentSize;

        // 计算宽、高各自需要的缩放比例
        const scaleX = screenSize.width / bgOriginalSize.width;
        const scaleY = screenSize.height / bgOriginalSize.height;

        // 取最大缩放比，确保一条边完全贴合屏幕，另一条边溢出被裁剪
        const finalScale = Math.max(scaleX, scaleY);
        this.node.setScale(finalScale, finalScale, 1);
    }
}