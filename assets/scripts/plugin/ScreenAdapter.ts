// assets/scripts/plugin/ScreenAdapter.ts
import { _decorator, Component, view, ResolutionPolicy } from 'cc';
const { ccclass } = _decorator;

/**
 * 屏幕适配组件
 * 根据设备实际宽高比动态选择 FIXED_HEIGHT 或 FIXED_WIDTH 策略
 */
@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {

    start() {
        this.adaptScreen();

        // 监听 Canvas 尺寸变化（窗口大小变化、横竖屏切换等）
        view.on('canvas-resize', this.adaptScreen, this);
    }

    /**
     * 执行屏幕适配
     * 根据当前屏幕宽高比与设计基准（720x1280）的比较，选择合适的适配策略
     */
    private adaptScreen() {
        const frameSize = view.getFrameSize();
        const screenRatio = frameSize.width / frameSize.height;
        const designRatio = 720 / 1280; // 设计基准比例

        if (screenRatio > designRatio) {
            // 宽屏设备（如 iPad、PC 浏览器）：高度填满，左右留白
            view.setDesignResolutionSize(720, 1280, ResolutionPolicy.FIXED_HEIGHT);
        } else {
            // 窄屏设备（如全面屏手机）：宽度填满，上下留白
            view.setDesignResolutionSize(720, 1280, ResolutionPolicy.FIXED_WIDTH);
        }
    }
}