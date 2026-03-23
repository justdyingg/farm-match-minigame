// assets/scripts/game/BoardManager.ts

// 1. 导入核心区的“单例大楼”图纸
import { Singleton } from "../core/Singleton";
// 2. 导入数据区的“绝密档案”和“花朵菜单”
import { BlockData, BlockType } from "../data/BlockData";

// 车间主任继承了单例大楼，保证全宇宙只有他一个主任！
export class BoardManager extends Singleton {

    // 规定棋盘的大小：8行 x 8列
    public readonly ROW_COUNT = 8;
    public readonly COL_COUNT = 8;

    // 【核心资产：超级大仓库】
    // 这是一个二维数组（装盒子的集装箱），专门用来存放 64 份方块的绝密档案
    public board: BlockData[][] = [];

    /**
     * 主任的核心动作：拉动电闸，瞬间生成满屏幕的方块档案数据！
     */
    public initBoard(): void {
        this.board = []; // 每次拉电闸前，先清空旧仓库

        // 第一层循环：控制“行 (y)”，从第 0 行一直铺到第 7 行
        for (let y = 0; y < this.ROW_COUNT; y++) {

            // 建一个临时的空架子，准备装“这一横排”的 8 份档案
            let row: BlockData[] = [];

            // 第二层循环：控制“列 (x)”，从左到右铺满这一行
            for (let x = 0; x < this.COL_COUNT; x++) {

                // 1. 摇骰子：从 0 到 3 随机选一个数字（对应花朵的品种）
                let randomFlower: BlockType = Math.floor(Math.random() * 4);

                // 2. 启动进料口：把坐标 (x,y) 和摇出来的花朵踹进 constructor！
                let blockData = new BlockData(x, y, randomFlower);

                // 3. 把填好的档案，放进这一横排的架子里
                row.push(blockData);
            }

            // 4. 当这一横排的 8 份档案全写好后，把整个架子塞进大仓库（二维数组）里！
            this.board.push(row);
        }

        console.log("📊 绝密档案生成完毕！看看这 64 份数据：", this.board);
    }
    /**
     * 【新增】：随机创建一个新的方块档案
     */
    public createNewBlock(x: number, y: number): BlockData {
        // 随机生成 0 到 3 的品种
        let randomType = Math.floor(Math.random() * 4);
        return { x: x, y: y, type: randomType };
    }
}