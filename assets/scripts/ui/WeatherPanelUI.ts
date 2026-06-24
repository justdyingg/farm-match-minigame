// assets/scripts/ui/WeatherPanelUI.ts
import { _decorator, Component, Label, Node, AudioClip } from 'cc';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

/**
 * 天气弹窗 UI 组件
 * 负责加载动画、天气数据展示和错误提示的视觉切换
 */
@ccclass('WeatherPanelUI')
export class WeatherPanelUI extends Component {

    // ---------- 天气信息展示 ----------

    @property({ type: Label, tooltip: "城市名称" })
    public cityLabel: Label = null!;

    @property({ type: Label, tooltip: "温度" })
    public tempLabel: Label = null!;

    @property({ type: Label, tooltip: "天气描述（晴、多云等）" })
    public descLabel: Label = null!;

    @property({ type: Label, tooltip: "湿度" })
    public humidityLabel: Label = null!;

    @property({ type: Label, tooltip: "风速" })
    public windLabel: Label = null!;

    // ---------- 加载与布局 ----------

    @property({ type: Node, tooltip: "加载状态容器（转圈动画 + 提示文字）" })
    public loadingNode: Node | null = null;

    @property({ type: Label, tooltip: "加载中的提示文字或错误信息" })
    public tipLabel: Label | null = null;

    @property({ type: Node, tooltip: "天气信息容器（包含 5 个天气 Label）" })
    public weatherInfoNode: Node | null = null;

    @property({ type: Node, tooltip: "白色内容背景框" })
    public panelNode: Node | null = null;

    @property({ type: AudioClip, tooltip: "关闭按钮音效" })
    public closeSound: AudioClip | null = null;

    /** 关闭弹窗的回调函数 */
    private _closeCallback: (() => void) | null = null;

    /**
     * 初始化并显示加载状态
     * @param onClose 关闭弹窗时执行的回调
     */
    public init(onClose: () => void) {
        this._closeCallback = onClose;
        this.showLoading();
    }

    /** 显示加载中状态（仅遮罩和转圈动画，隐藏内容） */
    public showLoading() {
        if (this.loadingNode) this.loadingNode.active = true;
        if (this.panelNode) this.panelNode.active = false;
        if (this.weatherInfoNode) this.weatherInfoNode.active = false;
        if (this.tipLabel) this.tipLabel.string = "正在获取天气...";
    }

    /**
     * 展示天气数据
     * @param data 天气数据对象，包含 city, temp, weatherDesc, humidity, windSpeed
     */
    public showWeatherData(data: any) {
        if (this.loadingNode) this.loadingNode.active = false;
        if (this.panelNode) this.panelNode.active = true;
        if (this.weatherInfoNode) this.weatherInfoNode.active = true;

        this.cityLabel.string = data.city;
        this.tempLabel.string = `${data.temp}°C`;
        this.descLabel.string = data.weatherDesc;
        this.humidityLabel.string = `湿度: ${data.humidity}%`;
        this.windLabel.string = `风速: ${data.windSpeed} km/h`;
    }

    /**
     * 显示错误提示信息
     * @param message 错误文本
     */
    public showError(message: string) {
        if (this.loadingNode) this.loadingNode.active = true;
        if (this.panelNode) this.panelNode.active = true;
        if (this.weatherInfoNode) this.weatherInfoNode.active = false;
        if (this.tipLabel) this.tipLabel.string = message;
    }

    /** 关闭按钮点击回调 */
    public onCloseClick() {
        if (this.closeSound) {
            AudioManager.getInstance(AudioManager).playSFX(this.closeSound);
        }
        this._closeCallback?.();
    }
}