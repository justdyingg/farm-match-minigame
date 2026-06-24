// assets/scripts/ui/DialogUI.ts
import { _decorator, Component, Label, Node, AudioClip } from 'cc';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

/**
 * 对话框 UI 组件
 * 负责填充对话框的视觉内容并响应确认/取消按钮
 */
@ccclass('DialogUI')
export class DialogUI extends Component {

    @property({ type: Label, tooltip: "标题文本" })
    public titleLabel: Label = null!;

    @property({ type: Label, tooltip: "消息内容文本" })
    public messageLabel: Label = null!;

    @property({ type: Node, tooltip: "取消按钮节点（可动态隐藏）" })
    public cancelButton: Node = null!;

    @property({ type: Node, tooltip: "确认按钮节点" })
    public confirmButton: Node = null!;

    @property({ type: AudioClip, tooltip: "按钮点击音效" })
    public confirmSound: AudioClip | null = null;

    /** 确认操作回调 */
    private _confirmCallback: (() => void) | null = null;

    /** 取消操作回调 */
    private _cancelCallback: (() => void) | null = null;

    /**
     * 显示对话框
     * @param title 标题文字
     * @param message 消息内容
     * @param onConfirm 确认回调（点击确认时调用）
     * @param onCancel 取消回调（点击取消时调用）
     * @param showCancel 是否显示取消按钮
     */
    public show(
        title: string,
        message: string,
        onConfirm?: () => void,
        onCancel?: () => void,
        showCancel: boolean = true
    ) {
        this.titleLabel.string = title;
        this.messageLabel.string = message;
        this._confirmCallback = onConfirm || null;
        this._cancelCallback = onCancel || null;

        if (this.cancelButton) {
            this.cancelButton.active = showCancel;
        }
        this.node.active = true;
    }

    /** 确认按钮点击事件 */
    public onConfirmClick() {
        if (this.confirmSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.confirmSound);
        }
        this._confirmCallback?.();
        this.node.active = false;
    }

    /** 取消按钮点击事件 */
    public onCancelClick() {
        if (this.confirmSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.confirmSound);
        }
        this._cancelCallback?.();
        this.node.active = false;
    }
}