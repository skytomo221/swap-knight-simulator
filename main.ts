type Piece = "blank" | "knight" | "pawn" | "rook" | "bishop";

type Cell = {
    readonly reference: Piece;
    readonly current: Piece;
} | undefined;

interface Coord {
    readonly x: number;
    readonly y: number;
}
interface Direction {
    readonly x: number;
    readonly y: number;
}
interface Effect {
    readonly coord: Coord;
    readonly timeStamp: number;
}

interface Board {
    readonly cells: readonly (readonly Cell[])[];
    readonly effects: Effect[];
    readonly player: Coord;
    readonly prevPlayer: Coord,
    readonly completed: boolean;
    readonly moveTimeStamp: number,
    readonly cellSize: number,
    readonly width: number;
    readonly height: number;
}

const animationLength = 15;

//ナイトが動ける方向(時計回り)
const knightMove = [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: -1 },
    { x: 1, y: -2 },
    { x: -1, y: -2 },
    { x: -2, y: -1 },
    { x: -2, y: 1 },
    { x: -1, y: 2 },
];

function flat<T>(array: T[][]): T[] {
    return array.reduce((prev, cur) => [...prev, ...cur], ([] as T[]));
}

function createBoard(level: Level): Board {
    const cells: Cell[][] = level.map(row => row.map(piece => piece !== undefined ? { reference: piece, current: piece } : undefined));
    const knightSearch = flat(level.map((row, x) => row.map((piece, y) => ({ piece, coord: { x, y } })))).filter(x => x.piece === "knight");
    if (knightSearch.length === 0) throw new Error("board must have a knight");
    const player = knightSearch[Math.floor(Math.random() * knightSearch.length)].coord;

    const width = cells.length;
    const height = Math.max(...cells.map(x => x.length));
    const cellSize = Math.min(1 / width, 1 / height);;

    return {
        cells,
        effects: [],
        player: player,
        prevPlayer: player,
        moveTimeStamp: 0,
        completed: true,
        cellSize,
        width,
        height,
    };
}

function setCell(cells: readonly (readonly Cell[])[], coord: Coord, piece: Piece): Cell[][] {
    return cells.map((row, x) =>
        row.map((cell, y) =>
            cell !== undefined && x == coord.x && y == coord.y
                ? { reference: cell.reference, current: piece } : cell));
}

//範囲外ならundefined
function getCell(cells: readonly (readonly Cell[])[], coord: Coord): Cell {
    const row = cells[coord.x];
    if (row === undefined) return undefined;
    return row[coord.y];
}

//移動先のセルを求める
function getDestinationCoord(coord: Coord, direction: Direction): Coord {
    return {
        x: coord.x + direction.x,
        y: coord.y + direction.y,
    };
}

//特定のマスが初期配置に戻されているか
function isReference(cell: Cell): boolean {
    if (cell === undefined) return true;
    return cell.reference === cell.current;
}
//クリアしたか？(全てのマスが初期配置に戻されているか)
function isCompleted(cells: readonly (readonly Cell[])[]): boolean {
    return cells.every(row => row.every(cell => isReference(cell)));
}

//移動後のBoardを返す
function move(board: Board, to: Coord, timeStamp: number): Board | null {
    //移動先座標が範囲外だったら移動不可
    const toCell = getCell(board.cells, to);
    if (toCell === undefined) return null;

    const fromCell = getCell(board.cells, board.player);
    if (fromCell === undefined) return null;

    const cells = setCell(setCell(board.cells, board.player, toCell.current), to, fromCell.current);

    const additionalEffects: Effect[] = [
        ...(fromCell.reference !== "blank" && isReference({ current: toCell.current, reference: fromCell.reference })
            ? [{ coord: board.player, timeStamp }] : []),
        ...(toCell.reference !== "blank" && isReference({ current: fromCell.current, reference: toCell.reference })
            ? [{ coord: to, timeStamp }] : []),
    ];
    return {
        player: to,
        effects: [...board.effects, ...additionalEffects],
        cells: cells,
        completed: isCompleted(cells),
        prevPlayer: board.player,
        moveTimeStamp: timeStamp,
        width: board.width,
        height: board.height,
        cellSize: board.cellSize,
    };
}

//クリックできるところにあるか
function isReachableCoord(coord: Coord, board: Board): boolean {
    return getCell(board.cells, coord) !== undefined &&
        knightMove.some(dir => coord.x - board.player.x == dir.x && coord.y - board.player.y == dir.y);
}

//盤面をシャッフル
function shuffle(board: Board, count: number = 0, prevBoard: Board = board): Board {
    if (count <= 0) {
        if (board.completed)
            return shuffle(board, board.width * board.height * 5 + Math.random() * 5);
        return board;
    }

    const possibleBoards = ([] as Board[]).concat(...knightMove
        .map(direction => {
            const coord = getDestinationCoord(board.player, direction);
            const cell = getCell(board.cells, coord);
            //戻るような手は選ばない
            if (coord.x === prevBoard.player.x && coord.y === prevBoard.player.y)
                return [];

            const board2 = move(board, coord, -10000);
            // 移動不能マスは抜く
            if (board2 === null) return [];
            //既に揃っているマスには積極的に進める
            if (isReference(cell))
                return [board2, board2, board2];
            return [board2];
        }));

    if (0 < possibleBoards.length) {
        //適当な手を選んで進める
        return shuffle(possibleBoards[Math.floor(Math.random() * possibleBoards.length)], count - 1, board);
    }
    else {
        //行く先がなかった場合、仕方なく一歩戻る
        return shuffle(prevBoard, count - 1, board);
    }
}

type Level = readonly (Piece | undefined)[][];

interface Game {
    readonly type: "game",
    readonly board: Board,
    readonly index: number;
}


function createGame(board: Board, index: number): Game {
    return {
        type: "game",
        board: shuffle(board),
        index: index,
    };
}

window.onload = () => {
    const levels: Level[] = [
        [
            ["knight", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "knight"],
        ],
        [
            ["knight", "blank", "blank", "pawn"],
            ["blank", "blank", "blank", "blank"],
            ["blank", "blank", "blank", "blank"],
            ["pawn", "blank", "blank", "knight"],
        ],
        [
            ["pawn", "blank", "blank", "pawn"],
            ["blank", "knight", "knight", "blank"],
            ["blank", "knight", "knight", "blank"],
            ["pawn", "blank", "blank", "pawn"],
        ],
        [
            [undefined, "rook", "blank", "rook", undefined],
            ["bishop", "blank", "blank", "blank", "bishop"],
            ["blank", "blank", "knight", "blank", "blank"],
            ["bishop", "blank", "blank", "blank", "bishop"],
            [undefined, "rook", "blank", "rook", undefined],
        ],
        [
            ["knight", "blank", "blank", "knight"],
            ["blank", "pawn", "pawn", "blank"],
            ["blank", "pawn", "pawn", "blank"],
            ["knight", "blank", "blank", "knight"],
        ],
        [
            ["blank", "blank", "blank", "pawn", "rook"],
            ["blank", "blank", "blank", "pawn", "bishop"],
            ["blank", "knight", "blank", "pawn", "bishop"],
            ["blank", "blank", "blank", "pawn", "bishop"],
            ["blank", "blank", "blank", "pawn", "rook"],
        ],
        [
            [undefined, "rook", "blank", "knight", undefined],
            ["pawn", "blank", "blank", "blank", "bishop"],
            ["blank", "blank", undefined, "blank", "blank"],
            ["bishop", "blank", "blank", "blank", "pawn"],
            [undefined, "knight", "blank", "rook", undefined],
        ],
        [
            ["knight", "knight", "knight", "knight",],
            ["knight", "blank", "blank", "knight",],
            ["knight", "blank", "blank", "knight",],
            ["knight", "knight", "knight", "knight",],
        ],
        [
            [undefined, "blank", "rook", "knight", "blank", undefined],
            ["blank", undefined, "blank", "blank", undefined, "blank"],
            ["pawn", "blank", undefined, undefined, "blank", "bishop"],
            ["bishop", "blank", undefined, undefined, "blank", "pawn"],
            ["blank", undefined, "blank", "blank", undefined, "blank"],
            [undefined, "blank", "knight", "rook", "blank", undefined],
        ],
        [
            [undefined, "rook", "knight", undefined],
            ["pawn", "blank", "blank", "bishop"],
            ["bishop", "blank", "blank", "pawn"],
            [undefined, "knight", "rook", undefined],
        ],
    ];

    var pattern_0 = 0;
    var pattern_1 = 0;
    var pattern_2 = 0;
    var pattern_3 = 0;
    var pattern_4 = 0;
    var pattern_5 = 0;
    [...Array(10000)].map((_, j) => {
        let game: Game = createGame(createBoard(levels[0]), 0);
        if (game.board.cells[0][0]?.current == "knight" && !(game.board.player.x == 0 && game.board.player.y == 0)) pattern_0++;
        if (game.board.cells[1][2]?.current == "knight" && !(game.board.player.x == 1 && game.board.player.y == 2) ||
            game.board.cells[2][1]?.current == "knight" && !(game.board.player.x == 2 && game.board.player.y == 1)) pattern_1++;
        if (game.board.cells[0][2]?.current == "knight" && !(game.board.player.x == 0 && game.board.player.y == 2) ||
            game.board.cells[2][0]?.current == "knight" && !(game.board.player.x == 2 && game.board.player.y == 0) ||
            game.board.cells[1][3]?.current == "knight" && !(game.board.player.x == 1 && game.board.player.y == 3) ||
            game.board.cells[3][1]?.current == "knight" && !(game.board.player.x == 3 && game.board.player.y == 1) ||
            game.board.cells[3][3]?.current == "knight" && !(game.board.player.x == 3 && game.board.player.y == 3)) pattern_2++;
        if (game.board.cells[0][1]?.current == "knight" && !(game.board.player.x == 0 && game.board.player.y == 1) ||
            game.board.cells[1][0]?.current == "knight" && !(game.board.player.x == 1 && game.board.player.y == 0) ||
            game.board.cells[2][3]?.current == "knight" && !(game.board.player.x == 2 && game.board.player.y == 3) ||
            game.board.cells[3][2]?.current == "knight" && !(game.board.player.x == 3 && game.board.player.y == 2)) pattern_3++;
        if (game.board.cells[1][1]?.current == "knight" && !(game.board.player.x == 1 && game.board.player.y == 1) ||
            game.board.cells[2][2]?.current == "knight" && !(game.board.player.x == 2 && game.board.player.y == 2)) pattern_4++;
        if (game.board.cells[0][3]?.current == "knight" && !(game.board.player.x == 0 && game.board.player.y == 3) ||
            game.board.cells[3][0]?.current == "knight" && !(game.board.player.x == 3 && game.board.player.y == 0)) pattern_5++;
        console.log({
            number: j,
            pattern_0: pattern_0,
            pattern_1: pattern_1,
            pattern_2: pattern_2,
            pattern_3: pattern_3,
            pattern_4: pattern_4,
            pattern_5: pattern_5,
            board: game.board,
        });
    })
    document.body.innerHTML = "Pattern 0: " + pattern_0.toString() + "<br>";
    document.body.innerHTML += "Pattern 1: " + pattern_1.toString() + "<br>";
    document.body.innerHTML += "Pattern 2: " + pattern_2.toString() + "<br>";
    document.body.innerHTML += "Pattern 3: " + pattern_3.toString() + "<br>";
    document.body.innerHTML += "Pattern 4: " + pattern_4.toString() + "<br>";
    document.body.innerHTML += "Pattern 5: " + pattern_5.toString() + "<br>";
};
