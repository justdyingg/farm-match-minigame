// assets/scripts/ui/DialogManager.ts
import { _decorator, Component, Prefab, instantiate, find } from 'cc';
import { DialogUI } from './DialogUI';

const { ccclass, property } = _decorator;

/**
 * 对话框管理器
 * 负责动态创建并显示确认框或提示框，统一管理对话框的生命周期
 */
@ccclass('DialogManager')
export class DialogManager extends Component {

    @property({ type: Prefab, tooltip: "对话框预制体（需挂载 DialogUI 脚本）" })
    public dialogPrefab: Prefab | null = null;

    /**
     * 显示带确认和取消按钮的对话框
     * @param title 标题
     * @param message 内容文本
     * @param onConfirm 点击确认时的回调
     * @param onCancel 点击取消时的回调（可选）
     */
    public showConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
        this._showDialog(title, message, onConfirm, onCancel, true);
    }

    /**
     * 显示仅有一个确认按钮的提示对话框
     * @param title 标题
     * @param message 内容文本
     * @param onConfirm 点击确认时的回调（可选）
     */
    public showAlert(title: string, message: string, onConfirm?: () => void) {
        this._showDialog(title, message, onConfirm, undefined, false);
    }

    /**
     * 内部通用对话框创建逻辑
     * @param title 标题
     * @param message 内容
     * @param onConfirm 确认回调
     * @param onCancel 取消回调
     * @param showCancel 是否显示取消按钮
     */
    private _showDialog(
        title: string,
        message: string,
        onConfirm?: () => void,
        onCancel?: () => void,
        showCancel: boolean = true
    ) {
        if (!this.dialogPrefab) return;

        const canvas = find('Canvas');
        if (!canvas) return;

        const dialogNode = instantiate(this.dialogPrefab);
        canvas.addChild(dialogNode);

        const dialogUI = dialogNode.getComponent(DialogUI);
        if (dialogUI) {
            // 包装回调，确保执行后销毁节点
            const wrapConfirm = () => {
                onConfirm?.();
                dialogNode.destroy();
            };
            const wrapCancel = () => {
                onCancel?.();
                dialogNode.destroy();
            };
            dialogUI.show(title, message, wrapConfirm, wrapCancel, showCancel);
        }
    }
}