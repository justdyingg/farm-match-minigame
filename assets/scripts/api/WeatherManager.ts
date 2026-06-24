// assets/scripts/api/WeatherManager.ts
import { Singleton } from '../core/Singleton';
import { Prefab, instantiate, director, Node, Canvas } from 'cc';
import { WeatherPanelUI } from '../ui/WeatherPanelUI';
import { DialogManager } from '../ui/DialogManager';

/**
 * 天气 API 管理器
 * 负责获取定位、请求天气数据、控制天气弹窗的完整生命周期
 */
export class WeatherManager extends Singleton {

    /** 天气弹窗预制体，由 FarmManager 在初始化时传入 */
    public weatherPanelPrefab: Prefab | null = null;

    /** 当前天气数据缓存，弹窗关闭后丢弃 */
    private _weatherData: any = null;

    /** 防重复点击锁，避免同时发起多个天气请求 */
    private _isLoading: boolean = false;

    /** 当前天气弹窗的 UI 控制脚本引用 */
    private _currentPanelUI: WeatherPanelUI | null = null;

    /** 当前网络请求的中断控制器，用于关闭弹窗时取消请求 */
    private _currentAbortController: AbortController | null = null;

    // ==================== 公共入口 ====================

    /**
     * 外部调用的统一入口
     * 加锁 → 显示加载弹窗 → 判断环境发起定位
     */
    public fetchWeather() {
        if (this._isLoading) {
            console.warn('⏳ 天气请求正在进行中，请勿重复点击');
            return;
        }
        console.log('🌤️ fetchWeather 开始');
        this._isLoading = true;
        this._showWeatherPopupWithLoading();

        const wx = (window as any).wx;
        if (typeof wx !== 'undefined' && wx.getLocation) {
            this._getWechatLocation();
        } else {
            this._getBrowserLocation();
        }
    }

    // ==================== 定位逻辑 ====================

    /** 微信小游戏环境定位 */
    private _getWechatLocation() {
        const wx = (window as any).wx;
        wx.getLocation({
            type: 'wgs84',
            success: (res: any) => {
                console.log('📍 微信定位成功:', res.latitude, res.longitude);
                this._requestWeatherByCoord(res.latitude, res.longitude);
            },
            fail: (err: any) => {
                console.warn('📍 微信定位失败', err);
                this._showLocationFailDialog();
            }
        });
    }

    /** 浏览器环境定位，含 5 秒超时兜底 */
    private _getBrowserLocation() {
        console.log('📍 开始浏览器定位');
        if (!navigator.geolocation) {
            console.warn('❌ 浏览器不支持定位');
            this._showLocationFailDialog();
            return;
        }

        const timeoutTimer = setTimeout(() => {
            console.warn('⏰ 定位超时');
            this._showLocationFailDialog();
        }, 5000);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(timeoutTimer);
                console.log('✅ 定位成功', position.coords.latitude, position.coords.longitude);
                this._requestWeatherByCoord(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                clearTimeout(timeoutTimer);
                console.warn('❌ 定位失败', error);
                this._showLocationFailDialog();
            },
            { enableHighAccuracy: false, maximumAge: 0 }
        );
    }

    // ==================== 定位失败处理 ====================

    /**
     * 定位失败时：关闭天气加载弹窗 → 弹出提示框 → 用户确认后重新请求北京天气
     */
    private _showLocationFailDialog() {
        this._closeWeatherPopup();

        const scene = director.getScene();
        if (!scene) { this._isLoading = false; return; }

        let canvasNode: Node | null = null;
        scene.children.forEach((child: Node) => {
            if (child.name === 'Canvas' || child.getComponent(Canvas)) {
                canvasNode = child;
            }
        });
        if (!canvasNode) { this._isLoading = false; return; }

        const dialogMgrNode = canvasNode.getChildByName('DialogManager');
        if (!dialogMgrNode) {
            console.error('❌ 未找到 DialogManager 节点');
            this._isLoading = false;
            return;
        }

        const dialogMgr = dialogMgrNode.getComponent(DialogManager);
        if (!dialogMgr) {
            console.error('❌ DialogManager 节点上未找到 DialogManager 组件');
            this._isLoading = false;
            return;
        }

        dialogMgr.showAlert(
            '获取位置失败',
            '使用默认地址（北京）',
            () => {
                console.log('🔄 用户确认，重新请求北京天气');
                this._isLoading = true;
                this._showWeatherPopupWithLoading();
                this._requestWeatherByCity('北京');
            }
        );
    }

    /** 关闭天气弹窗并清理状态 */
    private _closeWeatherPopup() {
        if (this._currentPanelUI) {
            this._currentAbortController?.abort();
            this._currentPanelUI.node.destroy();
            this._currentPanelUI = null;
        }
        this._isLoading = false;
    }

    // ==================== 天气请求 ====================

    /** 通过经纬度请求天气 */
    private async _requestWeatherByCoord(lat: number, lon: number) {
        await this._fetchWeather(`https://wttr.in/${lat},${lon}?format=j1`, '定位城市');
    }

    /** 通过城市名称请求天气 */
    private async _requestWeatherByCity(city: string) {
        await this._fetchWeather(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, city);
    }

    /**
     * 核心网络请求
     * 带 8 秒超时和中断功能，失败时自动降级到北京天气
     */
    private async _fetchWeather(url: string, fallbackCity: string) {
        this._currentAbortController?.abort();
        const controller = new AbortController();
        this._currentAbortController = controller;

        try {
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            this._weatherData = this._parseWttrData(data, fallbackCity);
            console.log('📊 天气数据', this._weatherData);
            this._onWeatherSuccess();
        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.log('⏹️ 请求已被取消（用户关闭弹窗或超时）');
                return;
            }
            console.error('❌ 天气请求失败', e);
            if (fallbackCity !== '北京') {
                await this._requestWeatherByCity('北京');
            } else {
                this._onWeatherFailed('网络异常，请稍后重试');
            }
        } finally {
            if (this._currentAbortController === controller) {
                this._currentAbortController = null;
            }
        }
    }

    /**
     * 解析 wttr.in 返回的天气数据
     * @param data API 原始返回数据
     * @param city 城市名称
     * @returns 只包含 UI 需要的字段
     */
    private _parseWttrData(data: any, city: string) {
        const current = data.current_condition[0];
        return {
            city: city,
            temp: current.temp_C,
            weatherDesc: current.weatherDesc[0].value,
            humidity: current.humidity,
            windSpeed: current.windspeedKmph,
        };
    }

    // ==================== 弹窗控制 ====================

    /** 实例化天气弹窗预制体并显示加载中状态 */
    private _showWeatherPopupWithLoading() {
        if (!this.weatherPanelPrefab) {
            console.error('❌ 预制体未设置');
            this._isLoading = false;
            return;
        }

        const scene = director.getScene();
        if (!scene) { this._isLoading = false; return; }

        let canvasNode: Node | null = null;
        scene.children.forEach((child: Node) => {
            if (child.name === 'Canvas' || child.getComponent(Canvas)) {
                canvasNode = child;
            }
        });
        if (!canvasNode) { this._isLoading = false; return; }

        const panelNode = instantiate(this.weatherPanelPrefab);
        panelNode.layer = 1 << 25; // UI_2D 渲染层
        canvasNode.addChild(panelNode);

        const ui = panelNode.getComponent(WeatherPanelUI);
        if (ui) {
            this._currentPanelUI = ui;
            ui.init(() => {
                // 关闭回调：中断请求、销毁节点、解锁
                this._currentAbortController?.abort();
                panelNode.destroy();
                this._currentPanelUI = null;
                this._isLoading = false;
            });
        }
    }

    /** 请求成功，更新弹窗内容为天气数据 */
    private _onWeatherSuccess() {
        this._isLoading = false;
        if (this._currentPanelUI && this._weatherData) {
            this._currentPanelUI.showWeatherData(this._weatherData);
        }
    }

    /** 请求失败，更新弹窗显示错误信息 */
    private _onWeatherFailed(message: string) {
        this._isLoading = false;
        if (this._currentPanelUI) {
            this._currentPanelUI.showError(message);
        }
    }
}