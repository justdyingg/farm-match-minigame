// assets/scripts/game/BoardManager.ts
import { Singleton } from "../core/Singleton";
import { BlockData, BlockType } from "../data/BlockData";

/**
 * 棋盘数据管理器
 * 负责生成无初始匹配的棋盘数据，并提供新方块生成接口
 */
export class BoardManager extends Singleton {
    /** 棋盘行数 */
    public readonly ROW_COUNT = 8;

    /** 棋盘列数 */
    public readonly COL_COUNT = 8;

    /** 棋盘数据：二维数组，board[y][x] 表示第 y 行第 x 列的方块 */
    public board: BlockData[][] = [];

    /**
     * 生成无初始匹配的棋盘数据
     * 逐格随机生成并检测，确保开局没有三消
     */
    public initBoard(): void {
        this.board = [];

        for (let y = 0; y < this.ROW_COUNT; y++) {
            const row: BlockData[] = [];

            for (let x = 0; x < this.COL_COUNT; x++) {
                let attempts = 0;
                let type: BlockType;

                // 随机尝试生成，避免横向或纵向出现连续三个相同
                do {
                    type = Math.floor(Math.random() * 4) as BlockType;
                    attempts++;

                    // 检查水平方向：与左边两个是否相同
                    let horizontalMatch = false;
                    if (x >= 2 && row[x - 1] && row[x - 2]) {
                        if (row[x - 1].type === type && row[x - 2].type === type) {
                            horizontalMatch = true;
                        }
                    }

                    // 检查垂直方向：与上边两个是否相同
                    let verticalMatch = false;
                    if (y >= 2 && this.board[y - 1] && this.board[y - 2]) {
                        if (this.board[y - 1][x]?.type === type && this.board[y - 2][x]?.type === type) {
                            verticalMatch = true;
                        }
                    }

                    if (!horizontalMatch && !verticalMatch) break;

                    // 防止无限循环：尝试 20 次后强制接受
                    if (attempts > 20) {
                        console.warn(`[BoardManager] 无法避免匹配在 (${x},${y})，强制使用 type=${type}`);
                        break;
                    }
                } while (true);

                row.push(new BlockData(x, y, type));
            }
            this.board.push(row);
        }
    }

    /**
     * 生成一个新方块，用于掉落填充
     * @param x 横坐标
     * @param y 纵坐标
     * @returns 随机类型的新方块数据
     */
    public createNewBlock(x: number, y: number): BlockData {
        const randomType = Math.floor(Math.random() * 4) as BlockType;
        return new BlockData(x, y, randomType);
    }
}