// assets/scripts/core/Singleton.ts

/**
 * 单例模式基类
 * 使用 Map 存储所有继承该类的唯一实例，保证全局唯一性
 */
export class Singleton {
    /** 全局实例缓存，key 为类构造函数，value 为该类的唯一实例 */
    private static _instances: Map<any, any> = new Map();

    /**
     * 获取类的唯一实例
     * @param c 类的构造函数
     * @returns 该类的唯一实例
     */
    public static getInstance<T>(c: { new(): T }): T {
        if (!this._instances.has(c)) {
            this._instances.set(c, new c());
        }
        return this._instances.get(c);
    }
}