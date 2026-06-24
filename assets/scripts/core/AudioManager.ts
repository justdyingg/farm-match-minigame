// assets/scripts/core/AudioManager.ts
import { AudioClip, AudioSource, Node, director } from 'cc';
import { Singleton } from './Singleton';

/**
 * 全局音频管理器
 * 基于常驻节点实现跨场景的 BGM 和 SFX 播放，切换场景时音乐不中断
 */
export class AudioManager extends Singleton {
    /** 背景音乐播放源 */
    private _bgmSource: AudioSource | null = null;

    /** 音效播放源（支持并发播放） */
    private _sfxSource: AudioSource | null = null;

    /** 是否已完成初始化 */
    private _isInitialized: boolean = false;

    /**
     * 初始化音频管理器
     * 创建全局常驻节点并挂载两个 AudioSource 组件
     */
    public init() {
        if (this._isInitialized) return;

        // 创建音频播放载体节点
        const audioNode = new Node("GlobalAudioManager");
        director.getScene()?.addChild(audioNode);

        // 标记为常驻节点，切换场景时不销毁
        director.addPersistRootNode(audioNode);

        // 分别挂载 BGM 和 SFX 的播放组件
        this._bgmSource = audioNode.addComponent(AudioSource);
        this._sfxSource = audioNode.addComponent(AudioSource);

        this._isInitialized = true;
    }

    /**
     * 播放背景音乐
     * @param clip 音频资源
     * @param loop 是否循环播放，默认 true
     * @param volume 音量大小，范围 0.0 ~ 1.0，默认 0.5
     */
    public playBGM(clip: AudioClip, loop: boolean = true, volume: number = 0.5) {
        if (!this._bgmSource || !clip) return;

        // 防止同一首歌重复播放
        if (this._bgmSource.clip === clip && this._bgmSource.playing) return;

        // 停止当前 BGM，更换音频资源并播放
        this._bgmSource.stop();
        this._bgmSource.clip = clip;
        this._bgmSource.volume = volume;
        this._bgmSource.loop = loop;
        this._bgmSource.play();
    }

    /**
     * 播放音效（支持并发叠加）
     * @param clip 音频资源
     */
    public playSFX(clip: AudioClip) {
        if (!this._sfxSource || !clip) return;

        // playOneShot 允许同时播放多个音效而不互相切断
        this._sfxSource.playOneShot(clip, 1.0);
    }
}