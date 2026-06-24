// assets/scripts/game/GameManager.ts
import { _decorator, Component, Prefab, instantiate, Node, tween, Vec3, UIOpacity, Label, Color, director, AudioClip, CCFloat } from 'cc';
import { StorageManager } from '../core/StorageManager';
import { BoardManager } from './BoardManager';
import { BlockController } from './BlockController';
import { Singleton } from '../core/Singleton';
import { EventManager } from '../core/EventManager';
import { BlockData } from '../data/BlockData';
import { AudioManager } from '../core/AudioManager';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    // ==================== 游戏状态 ====================

    /** 是否正在处理交换 / 消除 / 掉落逻辑，防止玩家连点 */
    private isProcessing: boolean = false;

    /** 剩余游戏时间（秒） */
    private gameTime: number = 20;

    /** 游戏是否已经结束 */
    private isGameOver: boolean = false;

    /** 玩家是否已经开始操作（第一次点击启动计时） */
    private timerStarted: boolean = false;

    /** 本局战利品统计：key 为花朵类型，value 为消除获得的种子数量 */
    private sessionHarvest: { [key: number]: number } = {};

    // ==================== 编辑器绑定属性 ====================

    @property({ type: Node, tooltip: "棋盘的底层托盘节点" })
    public boardNode: Node | null = null;

    @property({ type: Prefab, tooltip: "用来生成方块的预制体模具" })
    public blockPrefab: Prefab | null = null;

    @property({ type: Label, tooltip: "显示剩余时间的文字组件" })
    public timeLabel: Label | null = null;

    @property({ type: Node, tooltip: "游戏结束时的结算面板" })
    public gameOverPanel: Node | null = null;

    @property({ type: Label, tooltip: "结算面板上显示战利品的文字" })
    public resultLabel: Label | null = null;

    @property({ type: AudioClip, tooltip: "三消关卡背景音乐" })
    public bgmClip: AudioClip | null = null;

    @property({ type: CCFloat, tooltip: "BGM 音量 (0 ~ 1)", range: [0, 1], slide: true })
    public bgmVolume: number = 0.8;

    @property({ type: AudioClip, tooltip: "选中方块的音效" })
    public selectSfxClip: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: "消除成功时的音效" })
    public clearSfxClip: AudioClip | null = null;

    // ==================== 内部数据结构 ====================

    /** 玩家第一次点击的方块数据（用于交换判断） */
    private firstClickedBlock: BlockData | null = null;

    /** 棋盘上所有方块节点的二维数组（与棋盘数据一一对应） */
    private blockNodes: Node[][] = [];

    // ==================== 生命周期 ====================

    start() {
        StorageManager.getInstance(StorageManager).load();

        // 初始化音频并播放背景音乐
        const audioMgr = AudioManager.getInstance(AudioManager);
        audioMgr.init();
        if (this.bgmClip) {
            audioMgr.playBGM(this.bgmClip, true, this.bgmVolume);
        }

        // 生成棋盘数据并渲染
        BoardManager.getInstance(BoardManager).initBoard();
        this.renderBoard();

        // 订阅方块点击事件
        Singleton.getInstance(EventManager).on("EVENT_BLOCK_CLICKED", this.onBlockClicked, this);

        // 开局延迟 0.5 秒进行第一次全盘扫描，消除初始匹配
        this.isProcessing = true;
        (this as any).scheduleOnce(() => {
            this.checkGlobalMatches();
        }, 0.5);

        // 初始化时间显示
        if (this.timeLabel) {
            this.timeLabel.node.active = true;
            this.timeLabel.color = new Color(255, 255, 255);
            this.timeLabel.string = `点击开始: ${this.gameTime.toFixed(1)}s`;
            const opacity = this.timeLabel.node.getComponent(UIOpacity);
            if (opacity) opacity.opacity = 255;
        }
    }

    /**
     * 每帧更新，驱动倒计时和 UI 刷新
     */
    update(dt: number) {
        if (this.isGameOver || !this.timerStarted) return;

        this.gameTime -= dt;
        if (this.gameTime <= 0) {
            this.gameTime = 0;
            this.isGameOver = true;
            this.handleGameOver();
        }
        this.updateTimeUI();
    }

    // ==================== 棋盘渲染 ====================

    /**
     * 根据 BoardManager 中的数据创建所有方块节点
     */
    private renderBoard() {
        if (!this.boardNode || !this.blockPrefab) return;

        const boardData = BoardManager.getInstance(BoardManager).board;
        const blockSize = 80;
        this.blockNodes = [];

        for (let y = 0; y < 8; y++) {
            const nodeRow: Node[] = [];
            for (let x = 0; x < 8; x++) {
                const data = boardData[y][x];
                const blockNode = instantiate(this.blockPrefab);

                // 根据棋盘坐标计算屏幕位置
                const posX = (x - 4 + 0.5) * blockSize;
                const posY = (y - 4 + 0.5) * blockSize;
                blockNode.setPosition(posX, posY, 0);

                this.boardNode.addChild(blockNode);

                const blockController = blockNode.getComponent(BlockController);
                if (blockController) {
                    blockController.init(data);
                }
                nodeRow.push(blockNode);
            }
            this.blockNodes.push(nodeRow);
        }
    }

    // ==================== 玩家交互 ====================

    /**
     * 收到方块点击事件后的处理
     * @param flowerInfo 被点击方块的坐标与类型信息
     */
    private onBlockClicked(flowerInfo: BlockData) {
        if (this.isGameOver || this.isProcessing) return;

        // 首次点击启动计时
        if (!this.timerStarted) {
            this.timerStarted = true;
        }

        // 播放选中音效
        if (this.selectSfxClip) {
            AudioManager.getInstance(AudioManager).playSFX(this.selectSfxClip);
        }

        if (this.firstClickedBlock === null) {
            // 记录第一个选中的方块
            this.firstClickedBlock = flowerInfo;
        } else {
            const first = this.firstClickedBlock;
            const second = flowerInfo;

            // 忽略重复点击同一方块
            if (first.x === second.x && first.y === second.y) return;

            if (this.checkAdjacent(first, second)) {
                // 相邻则执行交换
                this.isProcessing = true;
                this.swapBlocks(first, second);
                this.firstClickedBlock = null;
            } else {
                // 不相邻则将选中目标切换为新点击的方块
                this.firstClickedBlock = second;
            }
        }
    }

    /**
     * 检查两个方块是否相邻（曼哈顿距离为 1）
     */
    private checkAdjacent(a: BlockData, b: BlockData): boolean {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return (dx + dy) === 1;
    }

    // ==================== 交换与回退 ====================

    /**
     * 交换两个方块（视觉 + 数据同步）
     */
    private swapBlocks(blockA: BlockData, blockB: BlockData) {
        const nodeA = this.blockNodes[blockA.y][blockA.x];
        const nodeB = this.blockNodes[blockB.y][blockB.x];
        const posA = nodeA.getPosition();
        const posB = nodeB.getPosition();

        // 视觉交换
        tween(nodeA).to(0.3, { position: posB }).start();
        tween(nodeB).to(0.3, { position: posA })
            .call(() => {
                // 动画结束后检测消除
                const matchesA = this.getMatches(blockA);
                const matchesB = this.getMatches(blockB);
                const allMatches = [...matchesA];
                matchesB.forEach(m => {
                    if (!allMatches.includes(m)) allMatches.push(m);
                });

                if (allMatches.length > 0) {
                    this.clearMatches(allMatches);
                } else {
                    this.swapBlocksBack(blockA, blockB);
                }
            })
            .start();

        // 数据层交换
        const board = BoardManager.getInstance(BoardManager).board;
        [blockA.x, blockB.x] = [blockB.x, blockA.x];
        [blockA.y, blockB.y] = [blockB.y, blockA.y];
        board[blockA.y][blockA.x] = blockA;
        board[blockB.y][blockB.x] = blockB;
        this.blockNodes[blockA.y][blockA.x] = nodeA;
        this.blockNodes[blockB.y][blockB.x] = nodeB;
    }

    /**
     * 无效交换时回退原位
     */
    private swapBlocksBack(blockA: BlockData, blockB: BlockData) {
        const nodeA = this.blockNodes[blockA.y][blockA.x];
        const nodeB = this.blockNodes[blockB.y][blockB.x];
        const posA = nodeA.getPosition();
        const posB = nodeB.getPosition();

        tween(nodeA).to(0.2, { position: posB }).start();
        tween(nodeB).to(0.2, { position: posA })
            .call(() => { this.isProcessing = false; })
            .start();

        // 数据层回退
        const board = BoardManager.getInstance(BoardManager).board;
        [blockA.x, blockB.x] = [blockB.x, blockA.x];
        [blockA.y, blockB.y] = [blockB.y, blockA.y];
        board[blockA.y][blockA.x] = blockA;
        board[blockB.y][blockB.x] = blockB;
        this.blockNodes[blockA.y][blockA.x] = nodeA;
        this.blockNodes[blockB.y][blockB.x] = nodeB;
    }

    // ==================== 消除检测 ====================

    /**
     * 以指定方块为中心，向四周收集同类型方块
     * @returns 所有满足三消及以上的方块列表
     */
    private getMatches(block: BlockData): BlockData[] {
        const board = BoardManager.getInstance(BoardManager).board;
        const horizontal: BlockData[] = [block];
        const vertical: BlockData[] = [block];

        // 向左扫描
        for (let i = block.x - 1; i >= 0; i--) {
            if (board[block.y][i].type === block.type) horizontal.push(board[block.y][i]);
            else break;
        }
        // 向右扫描
        for (let i = block.x + 1; i < 8; i++) {
            if (board[block.y][i].type === block.type) horizontal.push(board[block.y][i]);
            else break;
        }
        // 向上扫描
        for (let i = block.y - 1; i >= 0; i--) {
            if (board[i][block.x].type === block.type) vertical.push(board[i][block.x]);
            else break;
        }
        // 向下扫描
        for (let i = block.y + 1; i < 8; i++) {
            if (board[i][block.x].type === block.type) vertical.push(board[i][block.x]);
            else break;
        }

        const result: BlockData[] = [];
        if (horizontal.length >= 3) result.push(...horizontal);
        if (vertical.length >= 3) result.push(...vertical);
        return result;
    }

    /**
     * 全盘扫描检测可消除的方块组
     */
    private checkGlobalMatches() {
        const board = BoardManager.getInstance(BoardManager).board;
        const totalMatches: BlockData[] = [];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (!board[y][x]) continue;
                const matches = this.getMatches(board[y][x]);
                matches.forEach(m => {
                    if (!totalMatches.includes(m)) totalMatches.push(m);
                });
            }
        }

        if (totalMatches.length > 0) {
            this.clearMatches(totalMatches);
        } else {
            this.isProcessing = false;
        }
    }

    // ==================== 消除执行 ====================

    /**
     * 消除一组方块，发放奖励并播放消失动画
     */
    private clearMatches(matches: BlockData[]) {
        if (matches.length > 0 && this.clearSfxClip) {
            AudioManager.getInstance(AudioManager).playSFX(this.clearSfxClip);
        }

        // 统计本次消除数量，按类型发放阶梯奖励
        const typeCounts: { [key: number]: number } = {};
        matches.forEach(b => {
            if (!typeCounts[b.type]) typeCounts[b.type] = 0;
            typeCounts[b.type]++;
        });

        for (const typeStr in typeCounts) {
            const blockType = parseInt(typeStr);
            const count = typeCounts[blockType];
            const seedReward = count - 2; // 3消=1, 4消=2, 5消=3
            if (seedReward > 0) {
                if (!this.sessionHarvest[blockType]) this.sessionHarvest[blockType] = 0;
                this.sessionHarvest[blockType] += seedReward;
            }
        }

        // 播放消失动画并移除节点与数据
        matches.forEach(data => {
            const node = this.blockNodes[data.y][data.x];
            if (node) {
                const uiOpacity = node.getComponent(UIOpacity);
                tween(node).to(0.2, { scale: new Vec3(0, 0, 0) }).start();
                if (uiOpacity) {
                    tween(uiOpacity).to(0.2, { opacity: 0 }).call(() => node.destroy()).start();
                }
                this.blockNodes[data.y][data.x] = null!;
            }
            BoardManager.getInstance(BoardManager).board[data.y][data.x] = null!;
        });

        // 延迟后执行下落
        (this as any).scheduleOnce(() => {
            this.dropBlocks();
        }, 0.3);
    }

    // ==================== 下落与填充 ====================

    /**
     * 让上方方块下落填充空位
     */
    private dropBlocks() {
        const board = BoardManager.getInstance(BoardManager).board;
        const blockSize = 80;

        for (let x = 0; x < 8; x++) {
            let emptySpaces = 0;
            for (let y = 0; y < 8; y++) {
                if (board[y][x] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    const data = board[y][x];
                    const node = this.blockNodes[y][x];
                    const newY = y - emptySpaces;
                    data.y = newY;
                    board[newY][x] = data;
                    board[y][x] = null!;
                    this.blockNodes[newY][x] = node;
                    this.blockNodes[y][x] = null!;

                    const targetY = (newY - 4 + 0.5) * blockSize;
                    tween(node).to(0.2, { position: new Vec3(node.position.x, targetY, 0) }).start();
                }
            }
        }

        (this as any).scheduleOnce(() => {
            this.fillNewBlocks();
        }, 0.3);
    }

    /**
     * 在顶部空位生成新方块
     */
    private fillNewBlocks() {
        const board = BoardManager.getInstance(BoardManager).board;
        const blockSize = 80;

        for (let x = 0; x < 8; x++) {
            let emptyCount = 0;
            for (let y = 7; y >= 0; y--) {
                if (board[y][x] === null) emptyCount++;
                else break;
            }

            for (let i = 0; i < emptyCount; i++) {
                const targetY = 8 - emptyCount + i;
                const newData = BoardManager.getInstance(BoardManager).createNewBlock(x, targetY);
                board[targetY][x] = newData;

                const newNode = instantiate(this.blockPrefab!);
                this.boardNode!.addChild(newNode);

                const startY = (8 + i - 4 + 0.5) * blockSize;
                const posX = (x - 4 + 0.5) * blockSize;
                newNode.setPosition(posX, startY, 0);

                const ctrl = newNode.getComponent(BlockController);
                if (ctrl) ctrl.init(newData);
                this.blockNodes[targetY][x] = newNode;

                const targetPosY = (targetY - 4 + 0.5) * blockSize;
                tween(newNode).to(0.3, { position: new Vec3(posX, targetPosY, 0) }).start();
            }
        }

        (this as any).scheduleOnce(() => {
            this.checkGlobalMatches();
        }, 0.4);
    }

    // ==================== UI 更新 ====================

    /**
     * 更新屏幕上的倒计时显示（含 10 秒以下闪烁红字）
     */
    private updateTimeUI() {
        if (!this.timeLabel) return;
        this.timeLabel.string = `时间: ${this.gameTime.toFixed(1)}s`;
        if (this.gameTime <= 10) {
            this.timeLabel.color = new Color(255, 0, 0);
            const opacity = Math.abs(Math.sin(Date.now() / 200)) * 255;
            this.timeLabel.node.getComponent(UIOpacity)!.opacity = opacity;
        }
    }

    // ==================== 游戏结束 ====================

    /**
     * 时间归零后结算并展示战利品
     */
    private handleGameOver() {
        let resultText = "本局获得种子：\n";
        let totalSeeds = 0;

        const flowerNames: { [key: number]: string } = {
            0: "雏菊",
            1: "向日葵",
            2: "郁金香",
            3: "薰衣草"
        };

        for (const type in this.sessionHarvest) {
            const count = this.sessionHarvest[type];
            const blockType = parseInt(type);
            StorageManager.getInstance(StorageManager).addSeed(blockType, count);
            const name = flowerNames[blockType] || "神秘变异品种";
            resultText += `🌸 ${name}: ${count} 个\n`;
            totalSeeds += count;
        }

        if (totalSeeds === 0) {
            resultText = "手速太慢啦，颗粒无收！";
        }

        if (this.gameOverPanel && this.resultLabel) {
            this.resultLabel.string = resultText;
            this.gameOverPanel.active = true;
        }
    }

    /**
     * 返回农场场景
     */
    public onReturnToFarmClicked() {
        director.loadScene('FarmScene');
    }
}