// assets/scripts/ui/SpriteNumberLabel.ts
import { _decorator, Component, Node, Sprite, SpriteFrame, instantiate, UITransform } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 图片数字标签组件
 * 将数字字符串按位切分，动态生成对应图片节点，实现类似 Label 的数字显示效果
 */
@ccclass('SpriteNumberLabel')
export class SpriteNumberLabel extends Component {

    @property({ type: [SpriteFrame], tooltip: "数字 0-9 的 SpriteFrame 数组，严格按顺序排列" })
    public digitSprites: SpriteFrame[] = [];

    /** 当前显示的数字字符串 */
    private _currentString: string = "";

    /**
     * 设置显示的数字字符串（模仿 Label.string 的使用方式）
     * @example component.string = "123";
     */
    public set string(value: string) {
        if (this._currentString === value) return;
        this._currentString = value;
        this._updateDisplay();
    }

    public get string(): string {
        return this._currentString;
    }

    /**
     * 根据当前字符串动态更新图片数字节点
     */
    private _updateDisplay() {
        if (this.digitSprites.length < 10) {
            console.error("SpriteNumberLabel 警告: 请确保在编辑器里把 0-9 的图都拖进数组里！");
            return;
        }

        const container = this.node;
        const targetString = this._currentString;
        const currentChildren = container.children;

        // 为每一位字符创建或复用节点
        for (let i = 0; i < targetString.length; i++) {
            const char = targetString[i];
            const digitIndex = parseInt(char);

            // 非数字字符直接跳过
            if (isNaN(digitIndex) || digitIndex < 0 || digitIndex > 9) {
                console.warn(`SpriteNumberLabel 警告: 字符 '${char}' 不是有效数字，跳过显示。`);
                continue;
            }

            let digitNode: Node;
            if (i < currentChildren.length) {
                // 复用已存在的节点
                digitNode = currentChildren[i];
            } else {
                // 第一次创建时新建节点，之后克隆第 0 个作为模具
                if (i === 0) {
                    digitNode = new Node("Digit");
                    digitNode.addComponent(Sprite);
                    digitNode.addComponent(UITransform);
                    container.addChild(digitNode);
                } else {
                    digitNode = instantiate(currentChildren[0]);
                    container.addChild(digitNode);
                }
            }

            // 设置对应数字的 SpriteFrame
            const spriteFrame = this.digitSprites[digitIndex];
            if (spriteFrame) {
                const spComp = digitNode.getComponent(Sprite);
                spComp.spriteFrame = spriteFrame;
                spComp.sizeMode = Sprite.SizeMode.RAW;
                digitNode.active = true;
            }
        }

        // 隐藏多余的旧节点
        for (let j = targetString.length; j < currentChildren.length; j++) {
            currentChildren[j].active = false;
        }
    }

    /** 重置显示为 "0" */
    public resetToZero() {
        this.string = "0";
    }
}