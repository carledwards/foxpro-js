/*jslint bitwise: true */

// ------------------------
// Theme
// ------------------------
function FoxProTheme() {
    "use strict";
    return {
        screenBackground: {color: 'white', background: '#0000AA'},
        window: {
            border: {color: 'yellow', background: '#AAAAAA' },
            border_inactive: {color: 'gray', background: '#AAAAAA' },
            background: {color: 'white', background: '#00AAAA'}
        },
        dialog: {
            border: {color: 'white', background: 'DarkMagenta' },
            border_inactive: {color: 'gray', background: 'DarkMagenta' },
            background: {color: 'white', background: 'DarkMagenta'}
        },
        systemMenu: {
            color: {color: 'black', background: '#AAAAAA'},
            highlighted: {color: 'black', background: '#00AAAA'},
            hotKey: {color: 'white', background: '#00AAAA'},
            disabled: {color: 'cyan', background: '#AAAAAA'}
        },
        windowShadow: {color: 'gray', background: 'black'}
    };
}

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
    return function(e) {
        uiManager.handleMouseUp(position, e);
    };
}

function makeMouseDownHandler(uiManager, position) {
    "use strict";
    return function(e) {
        uiManager.handleMouseDown(position, e);
    };
}

function makeMouseOverHandler(uiManager, position) {
    "use strict";
    return function(e) {
        uiManager.handleMouseOver(position, e);
    };
}

function makeMouseDblClickHandler(uiManager, position) {
    "use strict";
    return function(e) {
        uiManager.handleMouseDblClick(position, e);
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

function drawWindow(uiManager, position, size, title, chromeCharacters, borderColor, background) {
    "use strict";

    var col, row;
    // draw the chrome
    for (col = 0; col < size.width; col = col + 1) {
        // top
        uiManager._video.setCharacter(
            new Position(col + position.column, position.row),
            chromeCharacters.top, borderColor);
        // bottom
        uiManager._video.setCharacter(
            new Position(col + position.column, position.row + size.height - 1),
            chromeCharacters.bottom, borderColor);
    }

    for (row = 1; row < size.height - 1; row = row + 1) {
        // left
        uiManager._video.setCharacter(
            new Position(position.column, row + position.row),
            chromeCharacters.left, borderColor);
        // right
        uiManager._video.setCharacter(
            new Position(position.column + size.width - 1, row + position.row),
            chromeCharacters.right, borderColor);
    }

    // draw the chrome controls
    uiManager._video.setCharacter(new Position(position.column, position.row),
        chromeCharacters.topLeftCorner, borderColor);

    uiManager._video.setCharacter(new Position(position.column + size.width - 1, position.row),
        chromeCharacters.topRightCorner, borderColor);

    uiManager._video.setCharacter(new Position(position.column + size.width - 1, position.row + size.height - 1),
        chromeCharacters.bottomRightCorner, borderColor);

    uiManager._video.setCharacter(new Position(position.column, position.row + size.height - 1),
        chromeCharacters.bottomLeftCorner, borderColor);

    // draw the title (if set)
    if (title) {
        var maxTitleLength = title.length > size.width - 4 ? size.width - 4 : title.length;
        for (col = 0; col < maxTitleLength; col = col + 1) {
            uiManager._video.setCharacter(
                new Position(Math.floor((size.width / 2) + position.column + col - (maxTitleLength / 2)),
                    position.row), title.charAt(col), borderColor);
        }
    }

    // draw the bottom shadow
    for (col = 0; col < size.width; col = col + 1) {
        uiManager._video.setColor(
            new Position(col + position.column + 2, position.row + size.height),
            'gray', 'black');
    }

    // draw the right shadow
    for (row = 1; row < size.height; row = row + 1) {
        uiManager._video.setColor(
            new Position(position.column + size.width, position.row + row),
            'gray', 'black');
        uiManager._video.setColor(
            new Position(position.column + size.width + 1, position.row + row),
            'gray', 'black');
    }

    // draw the inside
    for (col = 1; col < size.width - 1; col = col + 1) {
        for (row = 1; row < size.height - 1; row = row + 1) {
            uiManager._video.setCharacter(
                new Position(col + position.column, row + position.row),
                ' ', background);
        }
    }
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
            cell.ondblclick = makeMouseDblClickHandler(uiManager, new Position(l, i));

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

Video.prototype.setCharacter = function (position, chr, colorPair) {
    "use strict";
    if (position.column >= this._columns || position.row >= this._rows || position.column < 0 || position.row < 0) {
        return;
    }
    if (!chr || chr.length < 1) {
        return;
    }
    this._videoMap[position.row][position.column].textContent = chr.charAt(0) === ' ' ? '\u00A0' : chr.charAt(0);
    this._videoMap[position.row][position.column].style.color = colorPair.color || '';
    this._videoMap[position.row][position.column].style.backgroundColor = colorPair.background || '';
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
// UISystemMenu
// ------------------------

function UISystemMenu(uiManager, menuItems) {
    "use strict";
    this._uiManager = uiManager;
    this._menuItems = menuItems;
    this._menuSelectionRegions = [];
    this._selectedMenuItem = -1;
}

UISystemMenu.prototype.deselect = function() {
    "use strict";
    this._selectedMenuItem = -1;
};

UISystemMenu.prototype.draw = function() {
    "use strict";
    var col;

    // draw the entire color/background for the menu bar
    for (col = 0; col < this._uiManager._video._columns; col = col + 1) {
        this._uiManager._video.setCharacter(new Position(col, 0), ' ', this._uiManager._theme.systemMenu.color);
    }

    var i, charIndex;
    col = 1;
    this._menuSelectionRegions = [];
    for (i = 0; i < this._menuItems.length; i = i + 1) {
        // save off the range for mouse selection
        this._menuSelectionRegions.push([col - 1, col + this._menuItems[i].name.length]);

        // draw the space before the menu label
        if (this._selectedMenuItem === i) {
            this._uiManager._video.setCharacter(new Position(col - 1, 0), ' ', this._uiManager._theme.systemMenu.highlighted);
        }

        // draw the menu label
        for (charIndex = 0; charIndex < this._menuItems[i].name.length; charIndex = charIndex + 1) {
            this._uiManager._video.setCharacter(new Position(col, 0), this._menuItems[i].name.charAt(charIndex),
                this._selectedMenuItem === i ? this._uiManager._theme.systemMenu.highlighted : this._uiManager._theme.systemMenu.color);
            col = col + 1;
        }

        // draw the space after the menu label
        if (this._selectedMenuItem === i) {
            this._uiManager._video.setCharacter(new Position(col, 0), ' ', this._uiManager._theme.systemMenu.highlighted);
        }

        col = col + 2;
    }

    if (this._selectedMenuItem !== -1) {
        var maxLen = 0, itemLen;
        for (i = 0; i < this._menuItems[this._selectedMenuItem].items.length; i = i + 1) {
            itemLen = this._menuItems[this._selectedMenuItem].items[i].length;
            maxLen = itemLen > maxLen ? itemLen : maxLen;
        }
        drawWindow(this._uiManager, new Position(this._menuSelectionRegions[this._selectedMenuItem][0], 1),
            new Size(maxLen + 6, this._menuItems[this._selectedMenuItem].items.length + 2), null,
            {
                top: '─',
                bottom: '─',
                left: '│',
                right: '│',
                topLeftCorner: '┌',
                topRightCorner: '┐',
                bottomLeftCorner: '└',
                bottomRightCorner: '┘'
            },
            this._uiManager._theme.systemMenu.color, this._uiManager._theme.systemMenu.color);
        for (i = 0; i < this._menuItems[this._selectedMenuItem].items.length; i = i + 1) {
            for (charIndex = 0; charIndex < this._menuItems[this._selectedMenuItem].items[i].length; charIndex = charIndex + 1) {
                this._uiManager._video.setCharacter(new Position(this._menuSelectionRegions[this._selectedMenuItem][0] + 2 + charIndex, i + 2),
                    this._menuItems[this._selectedMenuItem].items[i].charAt(charIndex),
                    this._uiManager._theme.systemMenu.color);
            }
        }
    }
};

UISystemMenu.prototype.handleMouseDown = function(position) {
    "use strict";
    if (position.row !== 0) {
        return;
    }

    // reset the currently selected menu item
    var prevItem = this._selectedMenuItem;
    this._selectedMenuItem = -1;

    var i, range;
    for (i = 0; i < this._menuSelectionRegions.length; i = i + 1) {
        range = this._menuSelectionRegions[i];
        if (position.column >= range[0] && position.column <= range[1]) {
            this._selectedMenuItem = i;
            break;
        }
    }
    if (prevItem === this._selectedMenuItem) {
        this._selectedMenuItem = -1;
    }

    this._uiManager.refresh(true);
};

// ------------------------
// UIManager
// ------------------------

function UIManager(parentElement, columns, rows, theme) {
    "use strict";
    this._video = new Video(this, parentElement, columns, rows);
    this._workspace = {
        columns: columns,
        rows: rows - 1,
        rowOffset: 1
    };
    this._theme = theme;
    this._systemMenu = new UISystemMenu(this,
        [
            {name: 'File', items: [
                'New',
                'Open'
            ]},
            {name: 'Edit', items: [
                'Copy',
                'Paste',
                'Cut'
            ]},
            {name: 'Window', items: [
                'Next',
                'Prev',
                'Close All',
                'Arrange'
            ]}
        ]
    );
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

UIManager.prototype.setCharacter = function (position, chr, colorPair) {
    "use strict";
    this._video.setCharacter(position, chr, colorPair);
};

UIManager.prototype.refresh = function(forceFlag) {
    "use strict";

    var i;
    if (!forceFlag) {
        var isDirty = false;
        for (i = 0; !isDirty && i < this._windowStack.length; i = i + 1) {
            isDirty = this._windowStack[i].isDirty();
        }

        if (!isDirty) {
            return;
        }
    }

    var col, row;
    for (col = 0; col < this._video._columns; col = col + 1) {
        for (row = 0; row < this._video._rows; row = row + 1) {
            this.setCharacter(new Position(col, row), ' ', this._theme.screenBackground);
        }
    }

    for (i = 0; i < this._windowStack.length; i = i + 1) {
        this._windowStack[i].setFocus(i === this._windowStack.length - 1);
        this._windowStack[i].draw();
    }

    this._systemMenu.draw();

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

UIManager.prototype.handleMouseDown = function(position, e) {
    "use strict";

    if (position.row === 0) {
        this._systemMenu.handleMouseDown(position);
    }
    else {
        this._systemMenu.deselect();
    }

    if (this._windowStack.length === 0) {
        return;
    }
    var i, temp, evt = e || window.event;
    for (i = this._windowStack.length - 1; i >= 0; i = i - 1) {
        temp = this._windowStack[i];
        if (temp.handleMouseDown(position, evt)) {
            this._targetMouseWindow = temp;
            break;
        }
    }
};

UIManager.prototype.handleMouseUp = function(position, e) {
    "use strict";
    if (this._targetMouseWindow) {
        var evt = e || window.event;
        if(this._targetMouseWindow.handleMouseUp(position, evt)) {
            this.refresh();
        }
        delete this._targetMouseWindow;
    }
    this.setHideMouseTimer();
};

UIManager.prototype.handleMouseOver = function(position, e) {
    "use strict";
    if (this._targetMouseWindow) {
        position = position.row < this._workspace.rowOffset ? new Position(position.column, this._workspace.rowOffset) : position;
        this.setMousePosition(position);
        var evt = e || window.event;
        if (this._targetMouseWindow.handleMouseOver(position, evt)) {
            this.refresh();
        }
    }
    else {
        this.setMousePosition(position);
    }
};

UIManager.prototype.handleMouseDblClick = function(position, e) {
    "use strict";
    var i, win, evt = e || window.event;
    for (i = this._windowStack.length - 1; i >= 0; i = i - 1) {
        win = this._windowStack[i];
        if (win.handleMouseDblClick(position, evt)) {
            break;
        }
    }
};

UIManager.prototype.setHideMouseTimer = function() {
    "use strict";
    if (this._mouseInactivityTimeout) {
        return;
    }
    if (this._currentMousePosition && !this._targetMouseWindow) {
        var uiManager = this;
        this._mouseInactivityTimeout = setTimeout(function() {
            uiManager.unsetMousePosition();
            delete this._mouseInactivityTimeout;
        }, 2000);
    }
};

UIManager.prototype.unsetMousePosition = function() {
    "use strict";
    if (this._currentMousePosition) {
        this._video.setColor(this._currentMousePosition,
            getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).color),
            getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).backgroundColor));
        delete this._currentMousePosition;
    }
};

UIManager.prototype.setMousePosition = function(position) {
    "use strict";

    this.unsetMousePosition();

    // draw the current mouse position
    this._currentMousePosition = position;
    this._video.setColor(this._currentMousePosition,
        getInvertedColorCodeFromHex(this._video.getColor(position).color),
        getInvertedColorCodeFromHex(this._video.getColor(position).backgroundColor));

    if (this._mouseInactivityTimeout) {
        clearTimeout(this._mouseInactivityTimeout);
        delete this._mouseInactivityTimeout;
    }

    this.setHideMouseTimer();
};

UIManager.prototype.moveWindowToFront = function(win) {
    "use strict";
    var i, temp;
    for (i = 0; i < this._windowStack.length; i = i + 1) {
        if (this._windowStack[i] === win) {
            temp = this._windowStack.splice(i, 1)[0];
            temp.setDirty();
            this._windowStack.push(temp);
            this.refresh();
            break;
        }
    }
};

UIManager.prototype.removeWindow = function(win) {
    "use strict";
    var i;
    for (i = 0; i < this._windowStack.length; i = i + 1) {
        if (this._windowStack[i] === win) {
            this._windowStack.splice(i, 1);
            this.refresh(true);
            break;
        }
    }
};

// ------------------------
// UIWindow
// ------------------------

function UIWindow(title, position, size) {
    "use strict";
    this.setTitle(title);
    this.setPosition(position);
    this.setSize(size);
    this.setFocus(false);
    this._isDirty = true;
    this._isFullScreen = false;
    this._chromeCharacters = this.getChromeCharacters();
    this._windowControls = this.getWindowControls();
}

UIWindow.prototype.getChromeCharacters = function() {
    "use strict";
    return {
        top: ' ',
        bottom: ' ',
        left: ' ',
        right: ' ',
        topLeftCorner: ' ',
        topRightCorner: ' ',
        bottomLeftCorner: ' ',
        bottomRightCorner: ' '
    };
};

UIWindow.prototype.getWindowControls = function() {
    "use strict";
    return {
        close: true,
        maximize: true,
        resize: true
    };
};

UIWindow.prototype.getWindowThemeColors = function() {
    "use strict";
    return this._uiManager._theme.window;
};

UIWindow.prototype.setUIManager = function (uiManagerObj) {
    "use strict";
    this._uiManager = uiManagerObj;
    this._windowColor = this.getWindowThemeColors();
};

UIWindow.prototype.isDirty = function() {
    "use strict";
    return this._isDirty;
};

UIWindow.prototype.handleMouseDblClick = function (position, evt) {
    "use strict";
    if (position.row === this._position.row
        && position.column > this._position.column // do not include the control
        && position.column < this._position.column + this._size.width - 1) {
        if (this._isFullScreen) {
            this.restoreWindow();
        }
        else {
            this.setFullScreen();
        }
        return true;
    }
    return false;
};

UIWindow.prototype.handleMouseDown = function (position, evt) {
    "use strict";

    this._mouseDownPosition = position;

    if (position.row >= this._position.row
        && position.column >= this._position.column
        && position.row < this._position.row + this._size.height
        && position.column < this._position.column + this._size.width) {

        if (!evt.shiftKey) {
            this._uiManager.moveWindowToFront(this);
        }

        if (!this._isFullScreen) {
            if (position.row === this._position.row
                && position.column > this._position.column // do not include the control
                && position.column < this._position.column + this._size.width - 1) {
                this._inMouseMove = {
                    columnDragOffset: position.column - this._position.column
                };
            }
            else if (position.row === this._position.row + this._size.height - 1
                && position.column === this._position.column + this._size.width - 1) {
                if (this._hasFocus && this._windowControls.resize) {
                    this._inMouseResize = {};
                }
            }
        }

        return true;
    }

    return false;
};

UIWindow.prototype.setFullScreen = function() {
    "use strict";
    if (!this._hasFocus || !this._windowControls.maximize) {
        return;
    }
    if (this._isFullScreen) {
        return;
    }
    this._isFullScreen = true;
    this._restoreWindow = {
        position: this._position,
        size: this._size
    };
    this.setPosition(new Position(0, this._uiManager._workspace.rowOffset));
    this.setSize(new Size(this._uiManager._workspace.columns, this._uiManager._workspace.rows));
    this.setDirty();
};

UIWindow.prototype.restoreWindow = function() {
    "use strict";
    if (!this._hasFocus || !this._windowControls.maximize) {
        return;
    }
    if (!this._isFullScreen) {
        return;
    }
    this._isFullScreen = false;
    this.setPosition(this._restoreWindow.position);
    this.setSize(this._restoreWindow.size);
    this.setDirty();
};

UIWindow.prototype.handleMouseUp = function(position, evt) {
    "use strict";
    delete this._inMouseMove;
    delete this._inMouseResize;

    if (!this._hasFocus) {
        return;
    }

    // check that the mouse down and up are in the same location
    if (this._mouseDownPosition && this._mouseDownPosition.row === position.row
        && this._mouseDownPosition.column === position.column) {

        // full screen/restore control selected
        if (this._mouseDownPosition.row === this._position.row
            && this._mouseDownPosition.column === this._position.column + this._size.width - 1) {
            if (this._isFullScreen) {
                this.restoreWindow();
            }
            else {
                this.setFullScreen();
            }
        }
        // close control
        else if (this._mouseDownPosition.row === this._position.row
            && this._mouseDownPosition.column === this._position.column) {
            if (this._windowControls.close) {
                this._uiManager.removeWindow(this);
            }
        }
    }

    delete this._mouseDownPosition;
    return true;
};

UIWindow.prototype.handleMouseOver = function(position, evt) {
    "use strict";
    if (this._inMouseMove) {
        this.setPosition(
            new Position(position.column - this._inMouseMove.columnDragOffset, position.row)
        );
        return true;
    } else if (this._inMouseResize) {
        var width = position.column - this._position.column + 1;
        var height = position.row - this._position.row + 1;
        width = width < 5 ? 5 : width;
        height = height < 3 ? 3 : height;
        this.setSize(new Size(width, height));
        return true;
    }
    return false;
};

UIWindow.prototype.draw = function () {
    "use strict";
    var col;

    var borderColor = this._hasFocus ? this._windowColor.border : this._windowColor.border_inactive;
    drawWindow(this._uiManager, this._position, this._size, this._title,
        {
            top: this._chromeCharacters.top,
            bottom: this._chromeCharacters.bottom,
            left: this._chromeCharacters.left,
            right: this._chromeCharacters.right,
            topLeftCorner: this._hasFocus && this._windowControls.close ? '■' : this._chromeCharacters.topLeftCorner,
            topRightCorner: this._hasFocus && this._windowControls.maximize ? '≡' : this._chromeCharacters.topRightCorner,
            bottomRightCorner: this._hasFocus && this._windowControls.close && !this._isFullScreen ? '.' : this._chromeCharacters.bottomRightCorner,
            bottomLeftCorner: this._chromeCharacters.bottomLeftCorner
        },
        borderColor, this._windowColor.background);

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
        this._title = " " + title + " ";
        this.setDirty();
    }
};

UIWindow.prototype.setFocus = function (flag) {
    "use strict";
    this._hasFocus = flag;
};


// ------------------------
// UIDialogWindow
// ------------------------

function UIDialogWindow(title, position, size) {
    "use strict";
    UIWindow.call(this, title, position, size);
}

UIDialogWindow.prototype = Object.create(UIWindow.prototype);

UIDialogWindow.prototype.getChromeCharacters = function() {
    "use strict";
    return {
        top: '═',
        bottom: '═',
        left: '║',
        right: '║',
        topLeftCorner: '╔',
        topRightCorner: '╗',
        bottomLeftCorner: '╚',
        bottomRightCorner: '╝'
    };
};

UIDialogWindow.prototype.getWindowControls = function() {
    "use strict";
    return {
        close: false,
        maximize: false,
        resize: false
    };
};

UIDialogWindow.prototype.getWindowThemeColors = function() {
    "use strict";
    return this._uiManager._theme.dialog;
};
