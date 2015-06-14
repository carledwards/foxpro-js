/*jslint bitwise: true */

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
// utility functions
// ------------------------
function makeMouseUpHandler(uiManager, position) {
    "use strict";
    return function() {
        uiManager.handleMouseUp(position);
    };
}

function makeMouseDownHandler(uiManager, position) {
    "use strict";
    return function() {
        uiManager.handleMouseDown(position);
    };
}

function makeMouseOverHandler(uiManager, position) {
    "use strict";
    return function() {
        uiManager.handleMouseOver(position);
    };
}

function rgbToHex(rgb) {
    "use strict";
    var a = rgb.split("(")[1].split(")")[0];
    a = a.split(',');
    var b = a.map(function(x){
        x = parseInt(x, 10).toString(16);
        return (x.length === 1) ? "0" + x : x;
    });
    return "0x" + b.join("");
}

function getInvertedColorCodeFromHex(hex) {
    "use strict";
    var a = parseInt(hex, 16);
    a = ~a;
    a = a >>> 0;
    a = a.toString(2).slice(-24);
    a = parseInt(a, 2);
    a = 0x1000000 + a;
    a = a.toString(16).slice(-6).toUpperCase();
    return "#" + a;
}

// ------------------------
// Video Screen
// ------------------------

function Video(uiManager, parentElement, columns, rows) {
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

            // layout
            cell.style.float = 'left';
            cell.textContent = " ";
            if (l === 0) {
                cell.style.clear = 'left';
            }

            // mouse event handlers
            cell.onmouseover = makeMouseOverHandler(uiManager, new Position(l, i));
            cell.onmousedown = makeMouseDownHandler(uiManager, new Position(l, i));
            cell.onmouseup = makeMouseUpHandler(uiManager, new Position(l, i));

            // prevent mouse selection
            cell.style.userSelect = "none";
            cell.style.webkitUserSelect = "none";
            cell.style.mozUserSelect = "none";
            cell.style.msUserSelect = "none";

            newLine.appendChild(cell);
            this._videoMap[i][l] = cell;
        }
        this._innerWindow.appendChild(newLine);
    }
}

Video.prototype.setCharacter = function (position, chr, fcolor, bcolor) {
    "use strict";
    if (position.column >= this._columns || position.row >= this._rows || position.column < 0 || position.row < 0) {
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
    if (position.column >= this._columns || position.row >= this._rows || position.column < 0 || position.row < 0) {
        return;
    }
    this._videoMap[position.row][position.column].style.color = fcolor || '';
    this._videoMap[position.row][position.column].style.backgroundColor = bcolor || '';
};

Video.prototype.getColor = function (position) {
    "use strict";
    if (position.column >= this._columns || position.row >= this._rows || position.column < 0 || position.row < 0) {
        return;
    }
    return {
        color: rgbToHex(window.getComputedStyle(this._videoMap[position.row][position.column], null).color),
        backgroundColor: rgbToHex(window.getComputedStyle(this._videoMap[position.row][position.column], null).backgroundColor)
    };
};


// ------------------------
// UIManager
// ------------------------

function UIManager(parentElement, columns, rows) {
    "use strict";
    this._video = new Video(this, parentElement, columns, rows);
    this.reset();
}

UIManager.prototype.removeWindows = function () {
    "use strict";
    this._windowStack = [];
};

UIManager.prototype.reset = function () {
    "use strict";
    this.removeWindows();
    delete this._currentMousePosition;
    delete this._windowInMove;
};

UIManager.prototype.setCharacter = function (position, chr, fcolor, bcolor) {
    "use strict";
    this._video.setCharacter(position, chr, fcolor, bcolor);
};

UIManager.prototype.refresh = function() {
    "use strict";

    var isDirty = false, i;
    for (i = 0; !isDirty && i < this._windowStack.length; i = i + 1) {
        isDirty = this._windowStack[i].isDirty();
    }

    if (!isDirty) {
        return;
    }

    var col, row;
    for (col = 0; col < this._video._columns; col = col + 1) {
        for (row = 0; row < this._video._rows; row = row + 1) {
            this.setCharacter(new Position(col, row), ' ', 'white', '#0000AA');
        }
    }

    for (i = 0; i < this._windowStack.length; i = i + 1) {
        this._windowStack[i].draw();
    }

    // draw the mouse position
    if (this._currentMousePosition) {
        this._video.setColor(this._currentMousePosition,
            getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).color),
            getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).backgroundColor));
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

UIManager.prototype.eventLoop = function() {
    "use strict";
    this.refresh();
};

UIManager.prototype.handleMouseDown = function(position) {
    "use strict";
    // TODO may want let the pass this event on to the window to handle on its own

    if (this._windowStack.length === 0) {
        return;
    }
    var i, temp;
    for (i = this._windowStack.length - 1; i >= 0; i = i - 1) {
        if (position.row >= this._windowStack[i]._position.row
            && position.column >= this._windowStack[i]._position.column
            && position.row < this._windowStack[i]._position.row + this._windowStack[i]._size.height
            && position.column < this._windowStack[i]._position.column + this._windowStack[i]._size.width) {

            // only if this is not the top most window
            if (i !== this._windowStack.length - 1) {
                temp = this._windowStack.splice(i, 1)[0];
                temp.setDirty();
                this._windowStack.push(temp);
                this.refresh();
            }

            break;
        }
    }

    // TODO this check should be moved to the Window depending on it's behavior/controls
    // for the current window, check if are we in a move mode
    var topWindow = this._windowStack.slice(-1)[0];
    if (position.row === topWindow._position.row
        && position.column > topWindow._position.column // do not include the control
        && position.column < topWindow._position.column + topWindow._size.width - 1) {
        this._windowInMove = {
            window: topWindow,
            columnDragOffset: position.column - topWindow._position.column
        };
    }
};

UIManager.prototype.handleMouseUp = function(position) {
    "use strict";
    delete this._windowInMove;
};

UIManager.prototype.handleMouseOver = function(position) {
    "use strict";
    this.setMousePosition(position);

    if (this._windowInMove) {
        this._windowInMove.window.setPosition(
            new Position(position.column - this._windowInMove.columnDragOffset, position.row)
        );
    }
};

UIManager.prototype.setMousePosition = function(position) {
    "use strict";

    // unset currently set mouse position
    if (this._currentMousePosition) {
        this._video.setColor(this._currentMousePosition,
            getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).color),
            getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).backgroundColor));
    }

    // draw the current mouse position
    this._currentMousePosition = position;
    this._video.setColor(this._currentMousePosition,
        getInvertedColorCodeFromHex(this._video.getColor(position).color),
        getInvertedColorCodeFromHex(this._video.getColor(position).backgroundColor));
};


// ------------------------
// UIWindow
// ------------------------

function UIWindow(title, position, size) {
    "use strict";
    this.setTitle(title);
    this.setPosition(position);
    this.setSize(size);
    this._isDirty = true;
    }

UIWindow.prototype.setUIManager = function (uiManagerObj) {
    "use strict";
    this._uiManager = uiManagerObj;
};

UIWindow.prototype.isDirty = function() {
    "use strict";
    return this._isDirty;
};

UIWindow.prototype.draw = function () {
    "use strict";
    var col, row;

    // draw the chrome
    for (col = 0; col < this._size.width; col = col + 1) {
        // top
        this._uiManager._video.setCharacter(
            new Position(col + this._position.column, this._position.row),
            ' ', 'yellow', '#AAAAAA');
        // bottom
        this._uiManager._video.setCharacter(
            new Position(col + this._position.column, this._position.row + this._size.height - 1),
            ' ', 'yellow', '#AAAAAA');
    }

    for (row = 1; row < this._size.height - 1; row = row + 1) {
        // left
        this._uiManager._video.setCharacter(
            new Position(this._position.column, row + this._position.row),
            ' ', 'yellow', '#AAAAAA');
        // right
        this._uiManager._video.setCharacter(
            new Position(this._position.column + this._size.width - 1, row + this._position.row),
            ' ', 'yellow', '#AAAAAA');
    }

    // draw the chrome controls
    this._uiManager._video.setCharacter(new Position(this._position.column, this._position.row), '■', 'yellow', '#AAAAAA');
    this._uiManager._video.setCharacter(new Position(this._position.column + this._size.width - 1, this._position.row), '≡', 'yellow', '#AAAAAA');
    this._uiManager._video.setCharacter(new Position(this._position.column + this._size.width - 1, this._position.row + this._size.height - 1), '.', 'yellow', '#AAAAA');

    // draw the title (if set)
    if (this._title) {
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

    this._isDirty = false;
};

UIWindow.prototype.setDirty = function () {
    "use strict";
    this._isDirty = true;
};

UIWindow.prototype.setPosition = function (position) {
    "use strict";
    if (!this._position || (position && (position.column !== this._position.column || position.row !== this._position.row))) {
        this._position = position;
        this.setDirty();
    }
};

UIWindow.prototype.setSize = function (size) {
    "use strict";
    if (!this._size || (size && (size.width !== this._size.width || size.height !== this._size.height))) {
        this._size = size;
        this.setDirty();
    }
};

UIWindow.prototype.setTitle = function (title) {
    "use strict";
    if (title !== this._title) {
        this._title = title;
        this.setDirty();
    }
};
