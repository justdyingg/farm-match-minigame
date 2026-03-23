// assets/scripts/core/EventManager.ts
import { EventTarget } from 'cc';

export class EventManager {

    // 【核心设备】：Cocos 官方提供的一台极其稳定的“无线电发射塔”
    private _eventTarget: EventTarget = new EventTarget();

    /**
     * 1. 收听频道 (订阅事件)
     * @param eventName 频道的暗号（比如："BLOCK_CLICKED"）
     * @param callback 听到广播后你要干嘛（你的反应动作）
     * @param target 谁在收听（通常是你自己 this）
     */
    public on(eventName: string, callback: Function, target: any) {
        this._eventTarget.on(eventName, callback as any, target);
    }

    /**
     * 2. 取消收听 (拔掉耳机)
     * （极其重要：如果一个零件被销毁了，必须拔掉耳机，不然会报错漏电！）
     */
    public off(eventName: string, callback: Function, target: any) {
        this._eventTarget.off(eventName, callback as any, target);
    }

    /**
     * 3. 拿起对讲机全屏大喊！(发送广播)
     * @param eventName 频道的暗号
     * @param args 你要顺带传递的情报（比如坐标 x, y，是个百宝箱，想塞多少塞多少）
     */
    public emit(eventName: string, ...args: any[]) {
        this._eventTarget.emit(eventName, ...args);
    }
}