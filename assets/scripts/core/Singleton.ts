// assets/scripts/core/Singleton.ts

export class Singleton {

    // 这是一个 Map（字典），专门用来存放所有独一无二的管理员实体。
    // 谁也不能随便在外面 new，全都要关在这个柜子里统一管理。
    private static _instances: Map<any, any> = new Map();

    /**
     * 无论谁想找管理员办事，都必须拿着图纸（c）来这个窗口提货。
     */
    public static getInstance<T>(c: { new(): T }): T {
        // 保安查字典：如果柜子里还没有这个管理员...
        if (!this._instances.has(c)) {
            // 就立刻按图纸 new 一个出来，锁进柜子里！
            this._instances.set(c, new c());
        }

        // 凭着图纸当钥匙，把那个唯一的管理员实体交给你
        return this._instances.get(c);
    }
}