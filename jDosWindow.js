/*jslint bitwise: true */

// ------------------------
// Theme
// ------------------------
function FoxProTheme() {
    "use strict";
    return {
        screenBackground: {color: 'white', background: '#0000AA'},
        document: {
            border: {
                focus: {color: 'yellow', background: '#AAAAAA'},
                no_focus: {color: 'gray', background: '#AAAAAA'}
            },
            background: {
                focus: {color: 'white', background: '#00AAAA'},
                no_focus: {color: 'gray', background: '#00AAAA'}
            }
        },
        dialog: {
            border: {
                focus: {color: 'white', background: 'DarkMagenta'},
                no_focus: {color: 'gray', background: 'DarkMagenta'}
            },
            background: {
                focus: {color: 'white', background: 'DarkMagenta'},
                no_focus: {color: 'gray', background: 'DarkMagenta'}
            }
        },
        systemMenuBar: {
            background: {
                focus: {color: 'black', background: '#AAAAAA'},
                no_focus: {color: 'black', background: '#AAAAAA'}
            }
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

Video.prototype.setColor = function (position, colorPair) {
    "use strict";
    if (position.column >= this._columns || position.row >= this._rows || position.column < 0 || position.row < 0) {
        return;
    }
    this._videoMap[position.row][position.column].style.color = colorPair.color || '';
    this._videoMap[position.row][position.column].style.backgroundColor = colorPair.background || '';
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
// UIComponent
// ------------------------
function UIComponent(uiManager, parent, position, size) {
    "use strict";
    this._uiManager = uiManager;
    this._position = position;
    this._size = size;
    this._isDirty = true;
    this._children = [];
    this._hasFocus = false;
    this._parent = parent;
}

UIComponent.prototype.hasShadow = function() {
    "use strict";
    return false;
};

UIComponent.prototype.getTheme = function() {
    "use strict";
    throw "getTheme not defined";
};

UIComponent.prototype.getBorder = function() {
    "use strict";
    return null;
};

UIComponent.prototype.setDirty = function () {
    "use strict";
    this._isDirty = true;
};

UIComponent.prototype.setPosition = function (position) {
    "use strict";
    if (!this._position || (position && (position.column !== this._position.column || position.row !== this._position.row))) {
        this._position = position;
        this.setDirty();
    }
};

UIComponent.prototype.setSize = function (size) {
    "use strict";
    if (!this._size || (size && (size.width !== this._size.width || size.height !== this._size.height))) {
        this._size = size;
        this.setDirty();
    }
};

UIComponent.prototype.isDirty = function() {
    "use strict";
    if (this._isDirty) {
        return true;
    }
    var i;
    for (i = 0; i < this._children.length; i = i + 1) {
        if (this._children[i] === true) {
            return true;
        }
    }
    return false;
};

UIComponent.prototype.getTitle = function() {
    "use strict";
    return null;
};

UIComponent.prototype.getRelativeMouseLocation = function(mousePosition) {
    "use strict";
    var borderOffset = this.getBorder() ? 1 : 0;
    if ((mousePosition.row < this._position.row + borderOffset || mousePosition.row > this._position.row + this._size.height - 1 - borderOffset)
        || (mousePosition.column < this._position.column + borderOffset || mousePosition.column > (this._position.column + this._size.width - 1 - borderOffset))) {
        return undefined;  // TODO - determine if this is what we should be doing here
    }

    return {
        row: mousePosition.row - this._position.row - borderOffset,
        column: mousePosition.column - this._position.column - borderOffset
    };
};

UIComponent.prototype.drawComponentBase = function() {
    "use strict";

    var col, row;

    var theme = this.getTheme();
    var borderCharacters = this.getBorder();
    if (borderCharacters) {
        var borderColor = this._hasFocus ? theme.border.focus : theme.border.no_focus;
        // draw the border
        for (col = 0; col < this._size.width; col = col + 1) {
            // top
            this._uiManager._video.setCharacter(
                new Position(col + this._position.column, this._position.row),
                borderCharacters.top, borderColor);
            // bottom
            this._uiManager._video.setCharacter(
                new Position(col + this._position.column, this._position.row + this._size.height - 1),
                borderCharacters.bottom, borderColor);
        }

        for (row = 1; row < this._size.height - 1; row = row + 1) {
            // left
            this._uiManager._video.setCharacter(
                new Position(this._position.column, row + this._position.row),
                borderCharacters.left, borderColor);
            // right
            this._uiManager._video.setCharacter(
                new Position(this._position.column + this._size.width - 1, row + this._position.row),
                borderCharacters.right, borderColor);
        }

        // draw the border controls
        this._uiManager._video.setCharacter(new Position(this._position.column, this._position.row),
            borderCharacters.topLeftCorner, borderColor);

        this._uiManager._video.setCharacter(new Position(this._position.column + this._size.width - 1, this._position.row),
            borderCharacters.topRightCorner, borderColor);

        this._uiManager._video.setCharacter(new Position(this._position.column + this._size.width - 1, this._position.row + this._size.height - 1),
            borderCharacters.bottomRightCorner, borderColor);

        this._uiManager._video.setCharacter(new Position(this._position.column, this._position.row + this._size.height - 1),
            borderCharacters.bottomLeftCorner, borderColor);

        // draw the title (if set)
        var title = this.getTitle();
        if (title) {
            var maxTitleLength = title.length > this._size.width - 4 ? this._size.width - 4 : title.length;
            for (col = 0; col < maxTitleLength; col = col + 1) {
                this._uiManager._video.setCharacter(
                    new Position(Math.floor((this._size.width / 2) + this._position.column + col - (maxTitleLength / 2)),
                        this._position.row), title.charAt(col), borderColor);
            }
        }
    }

    if (this.hasShadow()) {
        // draw the bottom shadow
        for (col = 0; col < this._size.width; col = col + 1) {
            this._uiManager._video.setColor(
                new Position(col + this._position.column + 2, this._position.row + this._size.height),
                this._uiManager._theme.windowShadow);
        }

        // draw the right shadow
        for (row = 1; row < this._size.height; row = row + 1) {
            this._uiManager._video.setColor(
                new Position(this._position.column + this._size.width, this._position.row + row),
                this._uiManager._theme.windowShadow);
            this._uiManager._video.setColor(
                new Position(this._position.column + this._size.width + 1, this._position.row + row),
                this._uiManager._theme.windowShadow);
        }
    }

    // draw the inside
    var borderOffset = this.getBorder() ? 1 : 0;
    for (col = borderOffset; col < this._size.width - borderOffset; col = col + 1) {
        for (row = borderOffset; row < this._size.height - borderOffset; row = row + 1) {
            this._uiManager._video.setCharacter(
                new Position(col + this._position.column, row + this._position.row),
                ' ', this._hasFocus ? theme.background.focus : theme.background.no_focus);
        }
    }
};

UIComponent.prototype.innerDraw = function() {
    "use strict";
    throw "innerDraw not implemented";
};

UIComponent.prototype.draw = function(forceDraw) {
    "use strict";
    if (this.isDirty() || forceDraw) {
        this.drawComponentBase();
        this.innerDraw();
        var i;
        for (i = 0; i < this._children.length; i = i + 1) {
            this._children[i].draw(forceDraw);
        }
    }
    this._isDirty = false;
};

UIComponent.prototype.setFocus = function(flag) {
    "use strict";
    this._hasFocus = flag;
};

UIComponent.prototype.onMouseDownEvent = function(position, evt) {
    "use strict";
    return false;
};

UIComponent.prototype.onMouseUpEvent = function(position, evt) {
    "use strict";
    return false;
};

UIComponent.prototype.onMouseOverEvent = function(position, evt) {
    "use strict";
    return false;
};

UIComponent.prototype.onMouseDblClickEvent = function(position, evt) {
    "use strict";
    return false;
};

// ------------------------
// UIMenuBarItem
// ------------------------

function UIMenuBarItem(uiManager, parent, column, text) {
    "use strict";
    UIComponent.call(this, uiManager, parent,
        new Position(column, 0),
        new Size(text.length + 2, 1)
    );
    this._text = text;
}

UIMenuBarItem.prototype = Object.create(UIComponent.prototype);

UIMenuBarItem.prototype.innerDraw = function() {
    "use strict";

};

// ------------------------
// UISystemMenu
// ------------------------

function UISystemMenu(uiManager, config) {
    "use strict";
    UIComponent.call(this, uiManager, null,
        new Position(0, 0),
        new Size(uiManager._video._columns, 1)
    );
}

UISystemMenu.prototype = Object.create(UIComponent.prototype);

UISystemMenu.prototype.getTheme = function() {
    "use strict";
    return this._uiManager._theme.systemMenuBar;
};

UISystemMenu.prototype.innerDraw = function() {
    "use strict";

};

// ------------------------
// UIManager
// ------------------------

function UIManager(parentElement, columns, rows, theme) {
    "use strict";
    this._isDirty = true;
    this._video = new Video(this, parentElement, columns, rows);
    this._workspace = {
        columns: columns,
        rows: rows - 1,
        rowOffset: 1
    };
    this._theme = theme;
    this._systemMenu = new UISystemMenu(this,
        {'systemMenu': [
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
        ]}
    );
    this.reset();
    this.refresh();
}

UIManager.prototype.removeWindows = function () {
    "use strict";
    this._windowStack = [];
    this._isDirty = true;
    this.refresh();
};

UIManager.prototype.reset = function () {
    "use strict";
    this._systemMenu.setFocus(false);
    delete this._currentMousePosition;
    delete this._windowInMove;
    this.removeWindows();
};

UIManager.prototype.setCharacter = function (position, chr, colorPair) {
    "use strict";
    this._video.setCharacter(position, chr, colorPair);
};

UIManager.prototype.refresh = function() {
    "use strict";

    var i;
    if (!this._isDirty && !this._systemMenu.isDirty()) {
        var isDirty = false;
        for (i = 0; !isDirty && i < this._windowStack.length; i = i + 1) {
            isDirty = this._windowStack[i].isDirty();
        }

        if (!isDirty) {
            return;
        }
    }
    this._isDirty = false;

    var col, row;
    for (col = 0; col < this._video._columns; col = col + 1) {
        row = this._systemMenu ? 1 : 0;
        for (; row < this._video._rows; row = row + 1) {
            this.setCharacter(new Position(col, row), ' ', this._theme.screenBackground);
        }
    }

    for (i = 0; i < this._windowStack.length; i = i + 1) {
        this._windowStack[i].setFocus(i === this._windowStack.length - 1);
        this._windowStack[i].draw(true);
    }

    this._systemMenu.draw(true);

    // draw the mouse position
    if (this._currentMousePosition) {
        this._video.setColor(this._currentMousePosition, {
            color: getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).color),
            background: getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).backgroundColor)
        });
    }
};

UIManager.prototype.pushWindow = function(window) {
    "use strict";
    if (!window) {
        return undefined;
    }
    this._windowStack.push(window);
    this._isDirty = true;
    this.refresh();
    return window;
};

UIManager.prototype.eventLoop = function() {
    "use strict";
    this.refresh();
};

UIManager.prototype.handleMouseDown = function(position, e) {
    "use strict";

    var evt = e || window.event;
    if (!this._systemMenu.onMouseDownEvent(position, evt)) {
        if (this._windowStack.length === 0) {
            return;
        }
        var i, temp;
        for (i = this._windowStack.length - 1; i >= 0; i = i - 1) {
            temp = this._windowStack[i];
            if (temp.onMouseDownEvent(position, evt)) {
                this._targetMouseWindow = temp;
                break;
            }
        }
    }

    this.refresh();
};

UIManager.prototype.handleMouseUp = function(position, e) {
    "use strict";
    if (this._targetMouseWindow) {
        var evt = e || window.event;
        if(this._targetMouseWindow.onMouseUpEvent(position, evt)) {
            this.refresh();
        }
        delete this._targetMouseWindow;
    }
    this.setHideMouseTimer();
};

UIManager.prototype.handleMouseOver = function(position, e) {
    "use strict";
    var evt = e || window.event;
    if (!this._systemMenu.onMouseOverEvent(position, evt)) {
        if (this._targetMouseWindow) {
            position = position.row < this._workspace.rowOffset ? new Position(position.column, this._workspace.rowOffset) : position;
            this.setMousePosition(position);
            this._targetMouseWindow.onMouseOverEvent(position, evt);
            this.refresh();
        }
    }

    this.setMousePosition(position);
};

UIManager.prototype.handleMouseDblClick = function(position, e) {
    "use strict";
    var i, win, evt = e || window.event;
    for (i = this._windowStack.length - 1; i >= 0; i = i - 1) {
        win = this._windowStack[i];
        if (win.onMouseDblClickEvent(position, evt)) {
            this.refresh();
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
        this._video.setColor(this._currentMousePosition, {
            color: getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).color),
            background: getInvertedColorCodeFromHex(this._video.getColor(this._currentMousePosition).backgroundColor)
        });
        delete this._currentMousePosition;
    }
};

UIManager.prototype.setMousePosition = function(position) {
    "use strict";

    this.unsetMousePosition();

    // draw the current mouse position
    this._currentMousePosition = position;
    this._video.setColor(this._currentMousePosition, {
        color: getInvertedColorCodeFromHex(this._video.getColor(position).color),
        background: getInvertedColorCodeFromHex(this._video.getColor(position).backgroundColor)
    });

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
            this._isDirty = true;
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
            this._isDirty = true;
            break;
        }
    }
};

// ------------------------
// UIWindow
// ------------------------

function UIWindow(uiManager, title, position, size) {
    "use strict";
    UIComponent.call(this, uiManager, null, position, size);
    this.setTitle(title);
    this._isFullScreen = false;
    this._windowControls = this.getWindowControls();
}

UIWindow.prototype = Object.create(UIComponent.prototype);

UIWindow.prototype.getBorder = function() {
    "use strict";
    var retval = {
        top: ' ',
        bottom: ' ',
        left: ' ',
        right: ' ',
        topLeftCorner: ' ',
        topRightCorner: ' ',
        bottomLeftCorner: ' ',
        bottomRightCorner: ' '
    };

    if (this._hasFocus) {
        if (this._windowControls.close) {
            retval.topLeftCorner = '■';
        }
        if (this._windowControls.maximize) {
            retval.topRightCorner = '≡';
        }
        if (this._windowControls.resize) {
            retval.bottomRightCorner = '.';
        }
    }

    return retval;
};

UIWindow.prototype.getWindowControls = function() {
    "use strict";
    return {
        close: true,
        maximize: true,
        resize: true
    };
};

UIWindow.prototype.getTheme = function() {
    "use strict";
    return this._uiManager._theme.document;
};

UIWindow.prototype.onMouseDblClickEvent = function (position, evt) {
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

UIWindow.prototype.onMouseDownEvent = function (position, evt) {
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

UIWindow.prototype.onMouseUpEvent = function(position, evt) {
    "use strict";
    delete this._inMouseMove;
    delete this._inMouseResize;

    if (!this._hasFocus) {
        return false;
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

UIWindow.prototype.onMouseOverEvent = function(position, evt) {
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

UIWindow.prototype.innerDraw = function () {
    "use strict";

    //var borderColor = this._hasFocus ? this._windowColor.border : this._windowColor.border_inactive;
    //var border = this.getBorder();
    //drawWindow(this, this._title, this.getBorder(), borderColor, this._windowColor.background);

};

UIWindow.prototype.setTitle = function (title) {
    "use strict";
    if (title !== this._title) {
        this._title = " " + title + " ";
        this.setDirty();
    }
};

UIWindow.prototype.getTitle = function() {
    "use strict";
    return this._title;
};

UIWindow.prototype.hasShadow = function() {
    "use strict";
    return true;
};

// ------------------------
// UIDialogWindow
// ------------------------

function UIDialogWindow(uiManager, title, position, size) {
    "use strict";
    UIWindow.call(this, uiManager, title, position, size);
}

UIDialogWindow.prototype = Object.create(UIWindow.prototype);

UIDialogWindow.prototype.getBorder = function() {
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

UIDialogWindow.prototype.getTheme = function() {
    "use strict";
    return this._uiManager._theme.dialog;
};

UIDialogWindow.prototype.hasShadow = function() {
    "use strict";
    return true;
};
