// assets/scripts/core/EventManager.ts
import { EventTarget } from 'cc';

/**
 * 全局事件管理器
 * 基于发布-订阅模式实现模块间松耦合通信
 */
export class EventManager {
    /** Cocos 原生事件目标对象，作为事件中转站 */
    private _eventTarget: EventTarget = new EventTarget();

    /**
     * 订阅事件
     * @param eventName 事件名称
     * @param callback 收到事件后执行的回调函数
     * @param target 回调函数的 this 指向
     */
    public on(eventName: string, callback: Function, target: any) {
        this._eventTarget.on(eventName, callback as any, target);
    }

    /**
     * 取消订阅事件
     * @param eventName 事件名称
     * @param callback 要移除的回调函数
     * @param target 绑定的 this 对象
     */
    public off(eventName: string, callback: Function, target: any) {
        this._eventTarget.off(eventName, callback as any, target);
    }

    /**
     * 发送广播事件
     * @param eventName 事件名称
     * @param args 传递给回调函数的参数
     */
    public emit(eventName: string, ...args: any[]) {
        this._eventTarget.emit(eventName, ...args);
    }
}