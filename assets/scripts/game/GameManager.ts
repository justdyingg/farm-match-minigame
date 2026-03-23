// assets/scripts/game/GameManager.ts
import { _decorator, Component, Prefab, instantiate, Node, tween, Vec3, UIOpacity, Label, Color } from 'cc';
import { StorageManager } from '../core/StorageManager';
// 导入车间主任
import { BoardManager } from './BoardManager';
// 【预告】：这是方块的“大脑”，虽然咱们还没写，但先把它请进来！
import { BlockController } from './BlockController';
import { Singleton } from '../core/Singleton';
import { EventManager } from '../core/EventManager';
import { BlockData } from '../data/BlockData';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    private isProcessing: boolean = false;
    private gameTime: number = 30;       // 总时间 30s
    private isGameOver: boolean = false;
    private timerStarted: boolean = false; // 是否已经开始计时（第一下点击才开始）
    // 当前这局游戏的“战利品统计”临时推车
    // key: 花朵类型 (BlockType), value: 消除的数量
    private sessionHarvest: { [key: number]: number } = {};

    // 【插座坑位】
    @property({ type: Prefab })
    public blockPrefab: Prefab | null = null;
    @property(Label)
    public timeLabel: Label | null = null;
    @property(Node)
    public gameOverPanel: Node | null = null;
    @property(Label)
    public resultLabel: Label | null = null;

    // 第一个点击的方块信息
    private firstClickedBlock: BlockData | null = null;
    // 【新增】：实体兵器库！专门装活生生的木头人节点！
    private blockNodes: Node[][] = [];

    start() {
        console.log("🚀 发动机点火！游戏主程序启动！");
        StorageManager.getInstance().load();
        // 1. 命令车间主任：立刻给我准备好 64 份绝密档案！
        BoardManager.getInstance(BoardManager).initBoard();
        // 2. 启动流水线：开始照着档案画方块！
        this.renderBoard();
        // 3. 戴上耳机，调到 "EVENT_BLOCK_CLICKED" 频道！
        // 【新增】：总指挥一上班，立刻戴上耳机，调到 "EVENT_BLOCK_CLICKED" 频道！
        // 只要听到有人喊这个暗号，立刻去翻开这本叫 this.onBlockClicked 的行动指南！
        Singleton.getInstance(EventManager).on("EVENT_BLOCK_CLICKED", this.onBlockClicked, this);
        // 【核心新增】：开局大扫除！
        // 给 0.5 秒的缓冲，让玩家先看一眼初始阵型，然后瞬间引爆！
        this.isProcessing = true;
        this.scheduleOnce(() => {
            console.log("🔍 开局雷达扫描启动...");
            this.checkGlobalMatches();
        }, 0.5);
        if (this.timeLabel) {
            this.timeLabel.node.active = true;
            this.timeLabel.color = new Color(255, 255, 255); // 初始白色
            this.timeLabel.string = `点击开始: ${this.gameTime.toFixed(1)}s`;

            // 确保初次显示时透明度是满的
            let opacity = this.timeLabel.node.getComponent(UIOpacity);
            if (opacity) opacity.opacity = 255;
        }

    }

    private renderBoard() {
        const boardData = BoardManager.getInstance(BoardManager).board;
        const blockSize = 80;
        this.blockNodes = [];
        for (let y = 0; y < 8; y++) {
            let nodeRow: Node[] = [];

            for (let x = 0; x < 8; x++) {

                let data = boardData[y][x];

                // 1. 启动克隆机：造出“木头人”实体（此时它还在后台的休息室，没上舞台）
                let blockNode = instantiate(this.blockPrefab!);

                // 2. 【极速优化】：在后台直接算出坐标，命令它站好位置！
                let posX = (x - 4 + 0.5) * blockSize;
                let posY = (y - 4 + 0.5) * blockSize;
                blockNode.setPosition(posX, posY, 0);

                // 3. 【极速优化】：位置定死了，衣服也准备好了，推上舞台！
                this.node.addChild(blockNode);

                // 4. 掏出大脑，注入灵魂档案！
                let blockController = blockNode.getComponent(BlockController);
                if (blockController) {
                    blockController.init(data);
                }
                // 【新增核心操作】：把这个活生生的木头人，塞进抽屉里！
                nodeRow.push(blockNode);
            }
            this.blockNodes.push(nodeRow);

        }
        console.log("🎨 极速版发动机流水线运转完毕！");
    }

    /**
     * 【新增】：总指挥的行动指南（听到广播后执行的动作）
     * 这里的入参 data，就是方块顺着电波扔过来的那份附件（它的绝密档案）！
     */
    private onBlockClicked(flowerInfo: BlockData) {
        // 忙碌或结束时，不准点
        if (this.isGameOver || this.isProcessing) return;

        // 【新增】：第一下点击，启动秒表！
        if (!this.timerStarted) {
            this.timerStarted = true;
            console.log("⏱️ 倒计时开始！冲啊！");
        }
        // 情景 A：备忘录是空的（说明这是玩家点的“第一个”方块）
        if (this.firstClickedBlock === null) {
            this.firstClickedBlock = flowerInfo; // 赶紧记在备忘录上！
            console.log(`📝 总指挥记录：玩家选定了第一个方块 -> (${flowerInfo.x}, ${flowerInfo.y})`);
        }
        // 情景 B：备忘录上已经有名字了！（说明玩家现在点的是“第二个”方块！）
        else {
            let first = this.firstClickedBlock;
            let second = flowerInfo;

            // 为了防止玩家像帕金森一样连续点同一个方块两次
            if (first.x === second.x && first.y === second.y) {
                console.log("⚠️ 别闹！你点的是同一个方块，取消选择！");
                // this.firstClickedBlock = null; // 撕掉备忘录，重新开始
                return;
            }
            // 2. 【新增】：启动数学安检门！
            let isAdjacent = this.checkAdjacent(first, second);

            if (isAdjacent) {
                console.log(`✅ 质检通过！绝对相邻！允许交换：方块 A(${first.x}, ${first.y}) 🆚 方块 B(${second.x}, ${second.y})`);
                // 扣上锁
                this.isProcessing = true;
                // 【绝杀登场】：拉下电闸，呼叫交换魔法！
                this.swapBlocks(first, second);

                // 交换完后清空备忘录，准备下一回合
                this.firstClickedBlock = null;
            } else {
                console.log(`❌ 质检失败！隔得太远了或者在对角线，拒绝交换！`);
                this.firstClickedBlock = second;
                return;

            }

            console.log(`⚔️ 准备交换！方块 A(${first.x}, ${first.y}) 🆚 方块 B(${second.x}, ${second.y})`);

            // 【极其重要】：一对流程走完后，必须把备忘录清空！不然没法点下一对了！
            this.firstClickedBlock = null;
        }
    }

    /**
     * 【新增】：核心数学质检员 - 判断两个档案是否绝对相邻
     */
    private checkAdjacent(blockA: BlockData, blockB: BlockData): boolean {
        // Math.abs() 就是求绝对值的魔法！
        let dx = Math.abs(blockA.x - blockB.x);
        let dy = Math.abs(blockA.y - blockB.y);

        // 如果加起来等于 1，直接返回 true (同意交换)，否则返回 false (拒绝)
        return (dx + dy) === 1;
    }

    /**
     * 【核心魔法】：交换两个方块的位置（肉身 + 灵魂）
     */
    private swapBlocks(blockA: BlockData, blockB: BlockData) {

        // ================= 1. 肉身互换（视觉动画） =================
        // 从兵器库里，精准揪出这两个木头人
        let nodeA = this.blockNodes[blockA.y][blockA.x];
        let nodeB = this.blockNodes[blockB.y][blockB.x];

        // 记录它们当前在屏幕上的绝对坐标
        let posA = nodeA.getPosition();
        let posB = nodeB.getPosition();

        // 呼叫 Tween 动画大师：
        // 命令 A 在 0.3 秒内，极其丝滑地飞到 B 的坐标位置
        tween(nodeA).to(0.3, { position: posB }).start();
        // 命令 B 在 0.3 秒内，极其丝滑地飞到 A 的坐标位置
        tween(nodeB).to(0.3, { position: posA })
            .call(() => {
                // 【核心：动画结束后的回调】
                // 1. 检查 A 交换后有没有凑够 3 个
                let matchesA = this.getMatches(blockA);
                // 2. 检查 B 交换后有没有凑够 3 个
                let matchesB = this.getMatches(blockB);

                // 替换原来的 let allMatches = [...matchesA, ...matchesB];
                let allMatches = [...matchesA];
                matchesB.forEach(m => {
                    // 如果数组里没有这个方块，才加进去
                    if (!allMatches.includes(m)) allMatches.push(m);
                });
                if (allMatches.length > 0) {
                    this.clearMatches(allMatches);
                } else {
                    this.swapBlocksBack(blockA, blockB);
                }
            })
            .start();

        // ================= 2. 灵魂互换（底层数据） =================
        let boardData = BoardManager.getInstance(BoardManager).board;

        // 交换它们自己档案上的 x, y 坐标
        let tempX = blockA.x;
        let tempY = blockA.y;
        blockA.x = blockB.x;
        blockA.y = blockB.y;
        blockB.x = tempX;
        blockB.y = tempY;

        // 交换它们在大仓库里的位置
        boardData[blockA.y][blockA.x] = blockA;
        boardData[blockB.y][blockB.x] = blockB;

        // 交换它们在实体兵器库里的位置
        this.blockNodes[blockA.y][blockA.x] = nodeA;
        this.blockNodes[blockB.y][blockB.x] = nodeB;

        console.log("✨ 互换完成！肉身和灵魂已完美同步！");
    }
    /**
     * 【核心算法】：从某一个点开始，向四周探测相同颜色的方块
     * 返回值：所有连在一起的相同颜色方块的列表
     */
    private getMatches(block: BlockData): BlockData[] {
        let horizontalMatches: BlockData[] = [block];
        let verticalMatches: BlockData[] = [block];
        let board = BoardManager.getInstance(BoardManager).board;

        // 1. 水平探测（左右）
        // 向左看
        for (let i = block.x - 1; i >= 0; i--) {
            if (board[block.y][i].type === block.type) horizontalMatches.push(board[block.y][i]);
            else break;
        }
        // 向右看
        for (let i = block.x + 1; i < 8; i++) {
            if (board[block.y][i].type === block.type) horizontalMatches.push(board[block.y][i]);
            else break;
        }

        // 2. 垂直探测（上下）
        // 向上看
        for (let i = block.y - 1; i >= 0; i--) {
            if (board[i][block.x].type === block.type) verticalMatches.push(board[i][block.x]);
            else break;
        }
        // 向下看
        for (let i = block.y + 1; i < 8; i++) {
            if (board[i][block.x].type === block.type) verticalMatches.push(board[i][block.x]);
            else break;
        }

        // 3. 汇总结果
        let allMatches: BlockData[] = [];
        if (horizontalMatches.length >= 3) allMatches = allMatches.concat(horizontalMatches);
        if (verticalMatches.length >= 3) allMatches = allMatches.concat(verticalMatches);

        return allMatches;
    }

    /**
     * 【核心动作】：销毁一组方块
     */
    private clearMatches(matches: BlockData[]) {
        // 1. 拿一个临时账本，把这批消除的方块按“花朵品种”分类数清楚
        let typeCounts: { [key: number]: number } = {};

        matches.forEach(block => {
            if (!typeCounts[block.type]) {
                typeCounts[block.type] = 0;
            }
            typeCounts[block.type]++; // 比如：向日葵计数 +1
        });

        // 2. 根据不同品种的数量，发放阶梯奖励
        for (let typeStr in typeCounts) {
            let blockType = parseInt(typeStr); // 把字典的 key 转回数字
            let count = typeCounts[blockType]; // 这种花在这次消除了几个？

            // 💡 核心策划公式：3消=1, 4消=2, 5消=3 (即：奖励 = 数量 - 2)
            let seedReward = count - 2;

            // 安全防线：确保只有正常的三消及以上才给奖励
            if (seedReward > 0) {
                // 装进这局游戏的临时推车里
                if (!this.sessionHarvest[blockType]) {
                    this.sessionHarvest[blockType] = 0;
                }
                this.sessionHarvest[blockType] += seedReward;

                console.log(`✨ 触发 ${count} 连消！获得花朵[${blockType}] 种子 +${seedReward}`);
            }
        }
        matches.forEach(data => {
            // 1. 从实体兵器库里抓出木头人
            let node = this.blockNodes[data.y][data.x];
            if (node) {
                // 2. 播一个“缩小+透明”的消失动画，播完直接踢出舞台
                // 拿到透明度组件
                let uiOpacity = node.getComponent(UIOpacity);
                tween(node)
                    .to(0.2, { scale: new Vec3(0, 0, 0) })
                    .start();
                // 如果你有透明度组件，额外给它一个动画
                if (uiOpacity) {
                    tween(uiOpacity)
                        .to(0.2, { opacity: 0 }) // 透明度现在归 UIOpacity 管，范围是 0-255
                        .call(() => {
                            node.destroy();
                        })
                        .start();
                }
                // 3. 兵器库位置清空
                this.blockNodes[data.y][data.x] = null!;
            }
            // 4. 账本（数据层）也要清空
            BoardManager.getInstance(BoardManager).board[data.y][data.x] = null!;
        });

        // 5. 重点来了：炸完之后，立刻叫所有人检查脚下！
        this.scheduleOnce(() => {
            this.dropBlocks();
        }, 0.3); // 等爆炸动画播完再掉
    }

    /**
     * 【核心逻辑】：方块下落补位
     */
    private dropBlocks() {
        let board = BoardManager.getInstance(BoardManager).board;
        let blockSize = 80;

        // 从左到右，一列一列地处理
        for (let x = 0; x < 8; x++) {
            let emptySpaces = 0;
            // 从底向上扫描
            for (let y = 0; y < 8; y++) {
                if (board[y][x] === null) {
                    emptySpaces++; // 记录这一列有多少个坑
                } else if (emptySpaces > 0) {
                    // 发现上方有方块，它需要掉到下面的坑里！
                    let blockData = board[y][x];
                    let blockNode = this.blockNodes[y][x];

                    // 更新数据坐标
                    let newY = y - emptySpaces;
                    blockData.y = newY;
                    board[newY][x] = blockData;
                    board[y][x] = null!;

                    // 更新兵器库
                    this.blockNodes[newY][x] = blockNode;
                    this.blockNodes[y][x] = null!;

                    // 物理掉落动画
                    let targetY = (newY - 4 + 0.5) * blockSize;
                    tween(blockNode)
                        .to(0.2, { position: new Vec3(blockNode.position.x, targetY, 0) })
                        .start();
                }
            }
        }

        // 掉落完成后，顶部肯定空了，我们需要“天降奇兵”！
        this.scheduleOnce(() => {
            this.fillNewBlocks();
        }, 0.3);
    }

    /**
     * 【核心动作】：补充顶部的空位
     */
    private fillNewBlocks() {
        let board = BoardManager.getInstance(BoardManager).board;
        const blockSize = 80;

        for (let x = 0; x < 8; x++) {
            // 1. 计算这一列顶部的空位数量
            let emptyCount = 0;
            for (let y = 7; y >= 0; y--) {
                if (board[y][x] === null) emptyCount++;
                else break; // 只要碰到有方块的，说明这一列下面的坑都填满了
            }

            // 2. 在每一列的“天外”生成新方块
            for (let i = 0; i < emptyCount; i++) {
                // 目标行号
                let targetYIdx = 8 - emptyCount + i;

                // 生成新档案
                let newData = BoardManager.getInstance(BoardManager).createNewBlock(x, targetYIdx);
                board[targetYIdx][x] = newData;

                // 克隆新木头人
                let newNode = instantiate(this.blockPrefab!);
                this.node.addChild(newNode);

                // 【关键】：先让它站在屏幕上方的“待命区”（玩家看不见的地方）
                let startY = (8 + i - 4 + 0.5) * blockSize;
                let targetY = (targetYIdx - 4 + 0.5) * blockSize;
                let posX = (x - 4 + 0.5) * blockSize;

                newNode.setPosition(posX, startY, 0);

                // 注入大脑
                let ctrl = newNode.getComponent(BlockController);
                if (ctrl) ctrl.init(newData);

                // 存入兵器库
                this.blockNodes[targetYIdx][x] = newNode;

                // 3. 执行“入场”动画
                tween(newNode)
                    .to(0.3, { position: new Vec3(posX, targetY, 0) })
                    .start();
            }
        }

        // 4. 【高阶逻辑】：全部补满后，要递归检查：新掉下来的会不会又凑成了 3 个？
        this.scheduleOnce(() => {
            this.checkGlobalMatches();
        }, 0.4);
    }
    /**
     * 【核心逻辑】：全盘扫描是否有可消除的方块（用于处理连击）
     */
    private checkGlobalMatches() {
        let board = BoardManager.getInstance(BoardManager).board;
        let totalMatches: BlockData[] = [];

        // 遍历全盘 64 个点
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (board[y][x]) {
                    let matches = this.getMatches(board[y][x]);
                    // 把找到的都塞进大名单，记得去重
                    matches.forEach(m => {
                        if (!totalMatches.includes(m)) totalMatches.push(m);
                    });
                }
            }
        }

        if (totalMatches.length > 0) {
            console.log("🔥 连击！自动触发消除！");
            this.clearMatches(totalMatches); // 再次引爆，形成循环！
        } else {
            console.log("✅ 盘面稳定，等待玩家操作。");
            // 解锁此时才允许玩家进行下一次点击
            this.isProcessing = false;
        }
    }
    /**
     * 【新增】：交换失败，原路返回
     */
    private swapBlocksBack(blockA: BlockData, blockB: BlockData) {
        console.log("🔄 没对上，执行反悔动画...");

        // 1. 获取肉身
        let nodeA = this.blockNodes[blockA.y][blockA.x];
        let nodeB = this.blockNodes[blockB.y][blockB.x];
        let posA = nodeA.getPosition();
        let posB = nodeB.getPosition();

        // 2. 飞回去（不需要再检查了，直接飞）
        tween(nodeA).to(0.2, { position: posB }).start();
        tween(nodeB).to(0.2, { position: posA }).start();

        // 3. 【核心】：数据也要换回去！否则账本就乱了
        let board = BoardManager.getInstance(BoardManager).board;

        let tempX = blockA.x; let tempY = blockA.y;
        blockA.x = blockB.x; blockA.y = blockB.y;
        blockB.x = tempX; blockB.y = tempY;

        board[blockA.y][blockA.x] = blockA;
        board[blockB.y][blockB.x] = blockB;
        this.blockNodes[blockA.y][blockA.x] = nodeA;
        this.blockNodes[blockB.y][blockB.x] = nodeB;
    }
    // 每帧都会执行（dt 是两帧之间的时间间隔，约 1/60 秒）
    update(dt: number) {
        if (this.isGameOver || !this.timerStarted) return;

        this.gameTime -= dt; // 扣除时间

        // 逻辑判断
        if (this.gameTime <= 0) {
            this.gameTime = 0;
            this.isGameOver = true;
            this.handleGameOver();
        }

        this.updateTimeUI();
    }

    private updateTimeUI() {
        if (!this.timeLabel) return;

        // 格式化显示，保留一位小数（比如 25.4）
        this.timeLabel.string = `时间: ${this.gameTime.toFixed(1)}s`;

        // --- 核心：闪烁变红逻辑 ---
        if (this.gameTime <= 10) {
            this.timeLabel.color = new Color(255, 0, 0); // 变红

            // 简单的闪烁效果：利用正弦函数随时间改变透明度
            let opacity = Math.abs(Math.sin(Date.now() / 200)) * 255;
            // 注意：Label 的颜色里包含透明度（Alpha），或者直接改 node 的 UIOpacity
            this.timeLabel.node.getComponent(UIOpacity)!.opacity = opacity;
        }
    }

    private handleGameOver() {
        console.log("⏱️ 时间到！开始结算战利品...");

        let resultText = "本局获得种子：\n";
        let totalSeeds = 0;

        // 🏆 【新增：本地化翻译字典】
        // 这里的 key 就是你 BlockData 里的 BlockType 枚举值
        const flowerNames: { [key: number]: string } = {
            0: "雏菊",      // BlockType.DAISY
            1: "向日葵",    // BlockType.SUNFLOWER
            2: "郁金香",    // BlockType.TULIP
            3: "薰衣草"     // BlockType.LAVENDER
        };

        // 1. 遍历本局战利品，存入本地数据库
        for (let type in this.sessionHarvest) {
            let count = this.sessionHarvest[type];
            let blockType = parseInt(type); // 将 string 的 key 转回 number

            // 调用大管家，存入背包并自动保存硬盘
            StorageManager.getInstance().addSeed(blockType, count);

            // 💡 【核心修改】：查字典！用 blockType 数字去字典里换中文名字
            let flowerName = flowerNames[blockType] || "神秘变异品种";

            // 拼凑出玩家看得懂的结算文字
            resultText += `🌸 ${flowerName}: ${count} 个\n`;
            totalSeeds += count;
        }

        if (totalSeeds === 0) {
            resultText = "手速太慢啦，颗粒无收！";
        }

        console.log(resultText);

        // 2. 显示结算 UI 面板
        if (this.gameOverPanel && this.resultLabel) {
            this.resultLabel.string = resultText;
            this.gameOverPanel.active = true; // 唤醒面板
        }
    }
}