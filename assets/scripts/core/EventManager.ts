// assets/scripts/core/EventManager.ts
import { Singleton } from "./Singleton";

// 定義回呼函式的型別
export type EventCallback = (...args: any[]) => void;

interface IEventData {
    callback: EventCallback;
    target: any;
}

export class EventManager extends Singleton<EventManager> {
    private _eventMap: Map<string, IEventData[]> = new Map();

    /**
     * 註冊事件 (Subscribe)
     * @param eventName 事件名稱
     * @param callback 回呼函式
     * @param target 綁定的目標 (通常傳入 this)
     */
    public on(eventName: string, callback: EventCallback, target: any): void {
        if (!this._eventMap.has(eventName)) {
            this._eventMap.set(eventName, []);
        }
        this._eventMap.get(eventName)!.push({ callback, target });
    }

    /**
     * 觸發事件 (Publish)
     * @param eventName 事件名稱
     * @param args 傳遞的參數
     */
    public emit(eventName: string, ...args: any[]): void {
        if (!this._eventMap.has(eventName)) return;
        
        const listeners = this._eventMap.get(eventName)!;
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener.callback.apply(listener.target, args);
        }
    }

    /**
     * 移除事件註冊 (Unsubscribe)
     */
    public off(eventName: string, callback: EventCallback, target: any): void {
        if (!this._eventMap.has(eventName)) return;

        const listeners = this._eventMap.get(eventName)!;
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            if (listener.callback === callback && listener.target === target) {
                listeners.splice(i, 1);
                break;
            }
        }
        
        if (listeners.length === 0) {
            this._eventMap.delete(eventName);
        }
    }
}