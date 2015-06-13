
// ------------------------
// Position
// ------------------------
function Position(column, row) {
    "use strict";
    return {
        column: column,
        row: row
    };
}

// ------------------------
// Size
// ------------------------
function Size(width, height) {
    "use strict";
    return {
        width: width,
        height: height
    };
}

// ------------------------
// Video Screen
// ------------------------

function Video(parentElement, columns, rows) {
    "use strict";
    var newLine, i;

    this._columns = columns;
    this._rows = rows;

    this._videoMap = new Array(rows);
    for (i = 0; i < rows; i = i + 1) {
        this._videoMap[i] = new Array(columns);
    }

    this._innerWindow = document.createElement('div');
    this._innerWindow.style.padding = "12px";

    this._outerWindow = document.createElement('div');
    this._outerWindow.style.fontFamily = 'Menlo, Monaco, Courier';
    this._outerWindow.style.fontSize = '12pt';
    this._outerWindow.style.margin = '0';
    this._outerWindow.id = 'videojs-outer-video';
    this._outerWindow.style.color = 'white';
    this._outerWindow.style.background = 'black';

    // measure size of the border window
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = '12px Menlo';
    var textDimentions = ctx.measureText('W');
    this._outerWindow.style.width = (textDimentions.width * columns) + 20 + "pt";
    this._outerWindow.style.height = 12 * 1.2 * rows + 18 + "pt";
    this._outerWindow.appendChild(this._innerWindow);
    parentElement.appendChild(this._outerWindow);

    // add elements for each cell
    var l, cell;
    for (i = 0; i < rows; i = i + 1) {
        newLine = document.createElement('div');
        newLine.className = "p";
        for (l = 0; l < columns; l = l + 1) {
            cell = document.createElement('div');
            cell.style.float = 'left';
            cell.textContent = " ";
            if (l === 0) {
                cell.style.clear = 'left';
            }
            newLine.appendChild(cell);
            this._videoMap[i][l] = cell;
        }
        this._innerWindow.appendChild(newLine);
    }
}

Video.prototype.setCharacter = function (position, chr, fcolor, bcolor) {
    "use strict";
    if (position.column >= this._columns || position.row >= this._rows) {
        return;
    }
    if (!chr || chr.length < 1) {
        return;
    }
    this._videoMap[position.row][position.column].textContent = chr.charAt(0) === ' ' ? '\u00A0' : chr.charAt(0);
    this._videoMap[position.row][position.column].style.color = fcolor || '';
    this._videoMap[position.row][position.column].style.backgroundColor = bcolor || '';
};

Video.prototype.setColor = function (position, fcolor, bcolor) {
    "use strict";
    if (position.column >= this._columns || position.row >= this._rows) {
        return;
    }
    this._videoMap[position.row][position.column].style.color = fcolor || '';
    this._videoMap[position.row][position.column].style.backgroundColor = bcolor || '';
};


// ------------------------
// UIManager
// ------------------------

function UIManager(parentElement, columns, rows) {
    "use strict";
    this._video = new Video(parentElement, columns, rows);
    this._windowStack = [];
}

UIManager.prototype.removeWindows = function () {
    "use strict";
    this._windowStack = [];
};

UIManager.prototype.setCharacter = function (position, chr, fcolor, bcolor) {
    "use strict";
    this._video.setCharacter(position, chr, fcolor, bcolor);
};

UIManager.prototype.refresh = function() {
    "use strict";
    var col, row;
    for (col = 0; col < this._video._columns; col = col + 1) {
        for (row = 0; row < this._video._rows; row = row + 1) {
            this.setCharacter(new Position(col, row), ' ', 'white', '#0000AA');
        }
    }
    var i;
    for (i = 0; i < this._windowStack.length; i = i + 1) {
        this._windowStack[i].draw();
    }
};

UIManager.prototype.pushWindow = function(window) {
    "use strict";
    if (!window) {
        return undefined;
    }
    window.setUIManager(this);
    this._windowStack.push(window);
    return window;
};


// ------------------------
// UIWindow
// ------------------------

function UIWindow(title, position, size) {
    "use strict";
    this.setTitle(title);
    this.setPosition(position);
    this.setSize(size);
    }

UIWindow.prototype.setUIManager = function (uiManagerObj) {
    "use strict";
    this._uiManager = uiManagerObj;
};

UIWindow.prototype.draw = function () {
    "use strict";
    var col, row;

    // draw the outside chrome
    for (col = 0; col < this._size.width; col = col + 1) {
        for (row = 0; row < this._size.height; row = row + 1) {
            this._uiManager._video.setCharacter(
                new Position(col + this._position.column, row + this._position.row),
                ' ', 'yellow', '#AAAAAA');
        }
    }

    // draw the chrome controls
    this._uiManager._video.setCharacter(new Position(this._position.column, this._position.row), '■', 'yellow', '#AAAAA');
    this._uiManager._video.setCharacter(new Position(this._position.column + this._size.width - 1, this._position.row), '≡', 'yellow', '#AAAAA');
    this._uiManager._video.setCharacter(new Position(this._position.column + this._size.width - 1, this._position.row + this._size.height - 1), '.', 'yellow', '#AAAAA');

    // draw the title (if set)
    if (this._title) {
        // TODO optimize and handle overflow
        var maxTitleLength = this._title.length > this._size.width - 4 ? this._size.width - 4 : this._title.length;
        for (col = 0; col < maxTitleLength; col = col + 1) {
            this._uiManager._video.setCharacter(
                new Position(Math.ceil((this._size.width / 2) + this._position.column + col - (maxTitleLength / 2)),
                    this._position.row), this._title.charAt(col), 'yellow', '#AAAA');
        }
    }

    // draw the bottom shadow
    for (col = 0; col < this._size.width; col = col + 1) {
        this._uiManager._video.setColor(
            new Position(col + this._position.column + 2, this._position.row + this._size.height),
            'gray', 'black');
    }

    // draw the right shadow
    for (row = 1; row < this._size.height; row = row + 1) {
        this._uiManager._video.setColor(
            new Position(this._position.column + this._size.width, this._position.row + row),
            'gray', 'black');
        this._uiManager._video.setColor(
            new Position(this._position.column + this._size.width + 1, this._position.row + row),
            'gray', 'black');
    }

    // draw the inside
    for (col = 1; col < this._size.width - 1; col = col + 1) {
        for (row = 1; row < this._size.height - 1; row = row + 1) {
            this._uiManager._video.setCharacter(
                new Position(col + this._position.column, row + this._position.row),
                ' ', 'white', '#00AAAA');
        }
    }
};

UIWindow.prototype.setPosition = function (position) {
    "use strict";
    // TODO validate the position
    this._position = position;
};

UIWindow.prototype.setSize = function (size) {
    "use strict";
    // TODO validate the size
    this._size = size;
};

UIWindow.prototype.setTitle = function (title) {
    "use strict";
    // TODO validate the title
    this._title = title;
};