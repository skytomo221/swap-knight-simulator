var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var animationLength = 15;
//ナイトが動ける方向(時計回り)
var knightMove = [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: -1 },
    { x: 1, y: -2 },
    { x: -1, y: -2 },
    { x: -2, y: -1 },
    { x: -2, y: 1 },
    { x: -1, y: 2 },
];
function flat(array) {
    return array.reduce(function (prev, cur) { return __spreadArrays(prev, cur); }, []);
}
function createBoard(level) {
    var cells = level.map(function (row) { return row.map(function (piece) { return piece !== undefined ? { reference: piece, current: piece } : undefined; }); });
    var knightSearch = flat(level.map(function (row, x) { return row.map(function (piece, y) { return ({ piece: piece, coord: { x: x, y: y } }); }); })).filter(function (x) { return x.piece === "knight"; });
    if (knightSearch.length === 0)
        throw new Error("board must have a knight");
    var player = knightSearch[Math.floor(Math.random() * knightSearch.length)].coord;
    var width = cells.length;
    var height = Math.max.apply(Math, cells.map(function (x) { return x.length; }));
    var cellSize = Math.min(1 / width, 1 / height);
    ;
    return {
        cells: cells,
        effects: [],
        player: player,
        prevPlayer: player,
        moveTimeStamp: 0,
        completed: true,
        cellSize: cellSize,
        width: width,
        height: height
    };
}
function setCell(cells, coord, piece) {
    return cells.map(function (row, x) {
        return row.map(function (cell, y) {
            return cell !== undefined && x == coord.x && y == coord.y
                ? { reference: cell.reference, current: piece } : cell;
        });
    });
}
//範囲外ならundefined
function getCell(cells, coord) {
    var row = cells[coord.x];
    if (row === undefined)
        return undefined;
    return row[coord.y];
}
//移動先のセルを求める
function getDestinationCoord(coord, direction) {
    return {
        x: coord.x + direction.x,
        y: coord.y + direction.y
    };
}
//特定のマスが初期配置に戻されているか
function isReference(cell) {
    if (cell === undefined)
        return true;
    return cell.reference === cell.current;
}
//クリアしたか？(全てのマスが初期配置に戻されているか)
function isCompleted(cells) {
    return cells.every(function (row) { return row.every(function (cell) { return isReference(cell); }); });
}
//移動後のBoardを返す
function move(board, to, timeStamp) {
    //移動先座標が範囲外だったら移動不可
    var toCell = getCell(board.cells, to);
    if (toCell === undefined)
        return null;
    var fromCell = getCell(board.cells, board.player);
    if (fromCell === undefined)
        return null;
    var cells = setCell(setCell(board.cells, board.player, toCell.current), to, fromCell.current);
    var additionalEffects = __spreadArrays((fromCell.reference !== "blank" && isReference({ current: toCell.current, reference: fromCell.reference })
        ? [{ coord: board.player, timeStamp: timeStamp }] : []), (toCell.reference !== "blank" && isReference({ current: fromCell.current, reference: toCell.reference })
        ? [{ coord: to, timeStamp: timeStamp }] : []));
    return {
        player: to,
        effects: __spreadArrays(board.effects, additionalEffects),
        cells: cells,
        completed: isCompleted(cells),
        prevPlayer: board.player,
        moveTimeStamp: timeStamp,
        width: board.width,
        height: board.height,
        cellSize: board.cellSize
    };
}
//クリックできるところにあるか
function isReachableCoord(coord, board) {
    return getCell(board.cells, coord) !== undefined &&
        knightMove.some(function (dir) { return coord.x - board.player.x == dir.x && coord.y - board.player.y == dir.y; });
}
//盤面をシャッフル
function shuffle(board, count, prevBoard) {
    var _a;
    if (count === void 0) { count = 0; }
    if (prevBoard === void 0) { prevBoard = board; }
    if (count <= 0) {
        if (board.completed)
            return shuffle(board, board.width * board.height * 5 + Math.random() * 5);
        return board;
    }
    var possibleBoards = (_a = []).concat.apply(_a, knightMove
        .map(function (direction) {
        var coord = getDestinationCoord(board.player, direction);
        var cell = getCell(board.cells, coord);
        //戻るような手は選ばない
        if (coord.x === prevBoard.player.x && coord.y === prevBoard.player.y)
            return [];
        var board2 = move(board, coord, -10000);
        // 移動不能マスは抜く
        if (board2 === null)
            return [];
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
function createGame(board, index) {
    return {
        type: "game",
        board: shuffle(board),
        index: index
    };
}
window.onload = function () {
    var levels = [
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
    __spreadArrays(Array(10000)).map(function (_, j) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        var game = createGame(createBoard(levels[0]), 0);
        if (((_a = game.board.cells[0][0]) === null || _a === void 0 ? void 0 : _a.current) == "knight" && game.board.player.x != 0 && game.board.player.y != 0)
            pattern_0++;
        if (((_b = game.board.cells[1][2]) === null || _b === void 0 ? void 0 : _b.current) == "knight" && game.board.player.x != 1 && game.board.player.y != 2 ||
            ((_c = game.board.cells[2][1]) === null || _c === void 0 ? void 0 : _c.current) == "knight" && game.board.player.x != 2 && game.board.player.y != 1)
            pattern_1++;
        if (((_d = game.board.cells[0][2]) === null || _d === void 0 ? void 0 : _d.current) == "knight" && game.board.player.x != 0 && game.board.player.y != 2 ||
            ((_e = game.board.cells[2][0]) === null || _e === void 0 ? void 0 : _e.current) == "knight" && game.board.player.x != 2 && game.board.player.y != 0 ||
            ((_f = game.board.cells[1][3]) === null || _f === void 0 ? void 0 : _f.current) == "knight" && game.board.player.x != 1 && game.board.player.y != 3 ||
            ((_g = game.board.cells[3][1]) === null || _g === void 0 ? void 0 : _g.current) == "knight" && game.board.player.x != 3 && game.board.player.y != 1 ||
            ((_h = game.board.cells[3][3]) === null || _h === void 0 ? void 0 : _h.current) == "knight" && game.board.player.x != 3 && game.board.player.y != 3)
            pattern_2++;
        if (((_j = game.board.cells[0][1]) === null || _j === void 0 ? void 0 : _j.current) == "knight" && game.board.player.x != 0 && game.board.player.y != 1 ||
            ((_k = game.board.cells[1][0]) === null || _k === void 0 ? void 0 : _k.current) == "knight" && game.board.player.x != 1 && game.board.player.y != 0 ||
            ((_l = game.board.cells[2][3]) === null || _l === void 0 ? void 0 : _l.current) == "knight" && game.board.player.x != 2 && game.board.player.y != 3 ||
            ((_m = game.board.cells[3][2]) === null || _m === void 0 ? void 0 : _m.current) == "knight" && game.board.player.x != 3 && game.board.player.y != 2)
            pattern_3++;
        if (((_o = game.board.cells[1][1]) === null || _o === void 0 ? void 0 : _o.current) == "knight" && game.board.player.x != 1 && game.board.player.y != 1 ||
            ((_p = game.board.cells[2][2]) === null || _p === void 0 ? void 0 : _p.current) == "knight" && game.board.player.x != 2 && game.board.player.y != 2)
            pattern_4++;
        if (((_q = game.board.cells[0][3]) === null || _q === void 0 ? void 0 : _q.current) == "knight" && game.board.player.x != 0 && game.board.player.y != 3 ||
            ((_r = game.board.cells[3][0]) === null || _r === void 0 ? void 0 : _r.current) == "knight" && game.board.player.x != 3 && game.board.player.y != 0)
            pattern_5++;
        console.log({
            number: j,
            pattern_0: pattern_0,
            pattern_1: pattern_1,
            pattern_2: pattern_2,
            pattern_3: pattern_3,
            pattern_4: pattern_4,
            pattern_5: pattern_5
        });
    });
    document.body.innerHTML = "Pattern 0: " + pattern_0.toString() + "<br>";
    document.body.innerHTML += "Pattern 1: " + pattern_1.toString() + "<br>";
    document.body.innerHTML += "Pattern 2: " + pattern_2.toString() + "<br>";
    document.body.innerHTML += "Pattern 3: " + pattern_3.toString() + "<br>";
    document.body.innerHTML += "Pattern 4: " + pattern_4.toString() + "<br>";
    document.body.innerHTML += "Pattern 5: " + pattern_5.toString() + "<br>";
};
