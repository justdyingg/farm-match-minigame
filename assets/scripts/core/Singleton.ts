export class Singleton<T> {
    private static _instance: any = null;

    public static getInstance<T>(c: { new(): T }): T {
        if (this._instance === null) {
            this._instance = new c();
        }
        return this._instance;
    }

    protected constructor() {
        // 保護建構子，防止外部直接 new
    }
}