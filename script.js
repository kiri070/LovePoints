const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasArea = document.getElementById("canvasArea");

const imageInput = document.getElementById("imageInput");

const addTextButton = document.getElementById("addText");
const addCustomTextButton = document.getElementById("addCustomText");

const textSizeSlider = document.getElementById("textSizeSlider");
const arrowSizeSlider = document.getElementById("arrowSizeSlider");
const textColorInput = document.getElementById("textColor");
const arrowColorInput = document.getElementById("arrowColor");

const rotateLeftButton = document.getElementById("rotateLeft");
const rotateRightButton = document.getElementById("rotateRight");

const deleteButton = document.getElementById("deleteButton");
const clearButton = document.getElementById("clearButton");
const saveButton = document.getElementById("saveButton");
const languageToggle = document.getElementById("languageToggle");

const starModeButton = document.getElementById("starModeButton");

let isStarMode = false;

const translations = {


ja: {

    documentTitle: "推しポイント",

    appTitle: "推しポイント",

    updateHistory: "更新履歴",

    chooseImage: "画像を選択",

    saveImage: "画像を保存",

    quickText: "ここ好き！",

    addCustomText: "テキスト追加",

    textSize: "文字サイズ",

    textColor: "文字色",

    arrowSize: "矢印・星サイズ",

    arrowColor: "矢印・星色",

    deleteSelection: "選択を削除",

    clearAll: "全部削除",

    addTextTitle: "テキストを追加",

    textPlaceholder: "テキストを入力...",

    add: "追加",

    back: "戻る",

    hint:
        "文字・矢印・星 移動：タップ / ドラッグ<br>" +
        "矢印・星描画：少し長押しして ドラッグ<br>" +
        "矢印回転：選択して ↶ ↷ で回転<br>",

    selectImageFirst: "先に画像を選択してください",

    languageToggleLabel: "言語を切り替え",

    starModeOn: "星モード：ON",

    starModeOff: "星モード：OFF"

},


en: {

    documentTitle: "LovePoints",

    appTitle: "LovePoints",

    updateHistory: "Updates",

    chooseImage: "Choose Image",

    saveImage: "Save Image",

    quickText: "Love this!",

    addCustomText: "Add Text",

    textSize: "Text Size",

    textColor: "Text Color",

    arrowSize: "Arrow / Star Size",

    arrowColor: "Arrow / Star Color",

    deleteSelection: "Delete Selection",

    clearAll: "Clear All",

    addTextTitle: "Add Text",

    textPlaceholder: "Enter text...",

    add: "Add",

    back: "Back",

    hint:
        "Move text/arrows/stars: tap / drag<br>" +
        "Draw arrow/star: press briefly, then drag<br>" +
        "Rotate arrow: select it, then use ↶ ↷<br>",

    selectImageFirst: "Please choose an image first",

    languageToggleLabel: "Switch language",

    starModeOn: "Star mode: ON",

    starModeOff: "Star mode: OFF"

}


};

let currentLanguage =
localStorage.getItem("lovePointsLanguage") === "en"
? "en"
: "ja";

function t(key) {

return translations[currentLanguage][key];


}

function applyLanguage() {


const translation =
    translations[currentLanguage];


document.documentElement.lang =
    currentLanguage;


document.title =
    translation.documentTitle;


document.querySelectorAll("[data-i18n]").forEach(function (element) {

    element.childNodes[0].nodeValue =
        translation[element.dataset.i18n];

});


document.querySelectorAll("[data-i18n-html]").forEach(function (element) {

    element.innerHTML =
        translation[element.dataset.i18nHtml];

});


document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {

    element.placeholder =
        translation[element.dataset.i18nPlaceholder];

});


languageToggle.setAttribute(
    "aria-label",
    translation.languageToggleLabel
);


languageToggle.dataset.language =
    currentLanguage;


starModeButton.setAttribute(
    "aria-label",
    isStarMode
        ? translation.starModeOn
        : translation.starModeOff
);


}

languageToggle.addEventListener("pointerup", function () {


currentLanguage =
    currentLanguage === "ja"
        ? "en"
        : "ja";



localStorage.setItem(
    "lovePointsLanguage",
    currentLanguage
);


applyLanguage();


});

applyLanguage();

// ============================
// データ
// ============================

let image = null;

let texts = [];

let arrows = [];

let stars = [];

let selectedObject = null;

let currentTextColor =
textColorInput.value || "#ffffff";

let currentArrowColor =
arrowColorInput.value || "#ff0000";

let draggingObject = null;

let dragOffsetX = 0;

let dragOffsetY = 0;

let isDrawingArrow = false;

let isDrawingStar = false;

let pendingArrowTimer = null;

let pendingArrowPointerId = null;

let pendingArrowStartX = 0;

let pendingArrowStartY = 0;

let arrowStartX = 0;

let arrowStartY = 0;

let arrowEndX = 0;

let arrowEndY = 0;

let starPoints = [];





// ============================
// 画像読み込み
// ============================

imageInput.addEventListener("change", function () {


const file = imageInput.files[0];

if (!file) {
    return;
}


const reader = new FileReader();


reader.onload = function (event) {

    image = new Image();


    image.onload = function () {

        canvas.width = image.width;

        canvas.height = image.height;


        updateCanvasDisplaySize();


        texts = [];

        arrows = [];

        stars = [];


        selectedObject = null;


        draw();

    };


    image.src =
        event.target.result;

};


reader.readAsDataURL(file);


});

// ============================
// テキスト追加
// ============================

addTextButton.addEventListener("pointerup", function () {


addText(t("quickText"));


});

addCustomTextButton.addEventListener("pointerup", function () {


if (!image) {

    alert(t("selectImageFirst"));

    return;
}


const overlay =
    document.getElementById("overlay");

const inputUI =
    document.getElementById("inputUI");


overlay.style.display =
    "block";

inputUI.style.display =
    "flex";


});

// ============================
// 星モード
// ============================

starModeButton.addEventListener("pointerup", function () {


isStarMode =
    !isStarMode;


if (isStarMode) {

    starModeButton.classList.add("active");

}
else {

    starModeButton.classList.remove("active");

}


applyLanguage();


});

// ============================
// テキスト追加ダイアログ
// ============================

const addText_button =
document.getElementById("addText_button");

addText_button.addEventListener("pointerup", function () {


const overlay =
    document.getElementById("overlay");

const inputUI =
    document.getElementById("inputUI");

const userText_area =
    document.getElementById("userText_area");


if (userText_area.value.trim().length === 0) {

    return;

}


addText(
    userText_area.value
);


overlay.style.display =
    "none";

inputUI.style.display =
    "none";


userText_area.value =
    "";

});

// ============================
// ダイアログキャンセル
// ============================

const cansel_dialog =
document.getElementById("cansel_dialog");

cansel_dialog.addEventListener("pointerup", function () {

const overlay =
    document.getElementById("overlay");

const inputUI =
    document.getElementById("inputUI");

const userText_area =
    document.getElementById("userText_area");


overlay.style.display =
    "none";

inputUI.style.display =
    "none";


userText_area.value =
    "";

});

function addText(textValue) {

if (!image) {

    alert(t("selectImageFirst"));

    return;
}


const text = {

    type: "text",

    text: textValue,

    x: canvas.width / 2,

    y: canvas.height / 2,

    size:
        Number(textSizeSlider.value),

    color:
        currentTextColor

};


texts.push(text);

selectedObject =
    text;


draw();

}

// ============================
// Canvas座標
// ============================

function updateCanvasDisplaySize() {

if (!canvas.width || !canvas.height) {
    return;
}


const isMobile =
    window.matchMedia(
        "(max-width: 600px)"
    ).matches;


const minDisplayWidth =
    isMobile ? 320 : 420;

const minDisplayHeight =
    isMobile ? 220 : 300;


const areaWidth =
    canvasArea.clientWidth ||
    window.innerWidth;


const maxDisplayWidth =
    Math.max(
        1,
        areaWidth
    );


const maxDisplayHeight =
    Math.max(
        isMobile ? 260 : 320,
        window.innerHeight - 250
    );


const minScale =
    Math.max(
        1,

        minDisplayWidth /
            canvas.width,

        minDisplayHeight /
            canvas.height
    );


const maxScale =
    Math.min(
        maxDisplayWidth /
            canvas.width,

        maxDisplayHeight /
            canvas.height
    );


const displayScale =
    Math.min(
        minScale,
        maxScale
    );


canvas.style.width =
    `${Math.round(
        canvas.width *
        displayScale
    )}px`;


canvas.style.height =
    `${Math.round(
        canvas.height *
        displayScale
    )}px`;
}

function getCanvasPosition(event) {

const rect =
    canvas.getBoundingClientRect();


const scaleX =
    canvas.width /
    rect.width;


const scaleY =
    canvas.height /
    rect.height;


return {

    x:
        (event.clientX - rect.left) *
        scaleX,

    y:
        (event.clientY - rect.top) *
        scaleY

};

}

// ============================
// オブジェクト検索
// ============================

function getObjectAt(x, y) {

// テキスト

for (
    let i = texts.length - 1;
    i >= 0;
    i--
) {

    const text =
        texts[i];


    ctx.font =
        `bold ${text.size}px sans-serif`;


    const width =
        ctx.measureText(
            text.text
        ).width;


    const height =
        text.size;


    if (
        x >= text.x - width / 2 &&
        x <= text.x + width / 2 &&
        y >= text.y - height &&
        y <= text.y + 5
    ) {

        return text;

    }

}


// 星

for (
    let i = stars.length - 1;
    i >= 0;
    i--
) {

    const star =
        stars[i];


    if (
        isNearStar(
            x,
            y,
            star
        )
    ) {

        return star;

    }

}


// 矢印

for (
    let i = arrows.length - 1;
    i >= 0;
    i--
) {

    const arrow =
        arrows[i];


    if (
        isNearLine(
            x,
            y,

            arrow.startX,
            arrow.startY,

            arrow.endX,
            arrow.endY,

            arrow.size + 15
        )
    ) {

        return arrow;

    }

}


return null;

}

// ============================
// 星の近くか判定
// ============================

function isNearStar(x, y, star) {

if (
    !star.points ||
    star.points.length < 2
) {

    return false;

}


for (
    let i = 1;
    i < star.points.length;
    i++
) {

    const point1 =
        star.points[i - 1];

    const point2 =
        star.points[i];


    if (
        isNearLine(
            x,
            y,

            point1.x,
            point1.y,

            point2.x,
            point2.y,

            star.size + 15
        )
    ) {

        return true;

    }

}


return false;

}

// ============================
// 線の近くか判定
// ============================

function isNearLine(
px,
py,
x1,
y1,
x2,
y2,
tolerance
) {

const dx =
    x2 - x1;

const dy =
    y2 - y1;


const lengthSquared =
    dx * dx +
    dy * dy;


if (lengthSquared === 0) {
    return false;
}


let t =
    (
        (px - x1) * dx +
        (py - y1) * dy
    )
    /
    lengthSquared;


t =
    Math.max(
        0,
        Math.min(
            1,
            t
        )
    );


const closestX =
    x1 + t * dx;

const closestY =
    y1 + t * dy;


const distance =
    Math.hypot(
        px - closestX,
        py - closestY
    );


return distance <= tolerance;

}

// ============================
// 長押しキャンセル
// ============================

function clearPendingArrow() {

if (pendingArrowTimer) {

    clearTimeout(
        pendingArrowTimer
    );

    pendingArrowTimer =
        null;

}


pendingArrowPointerId =
    null;

}

// ============================
// 矢印描画開始
// ============================

function startArrowDrawing(
pos,
pointerId
) {

isDrawingArrow =
    true;


selectedObject =
    null;


arrowStartX =
    pos.x;

arrowStartY =
    pos.y;


arrowEndX =
    pos.x;

arrowEndY =
    pos.y;


if (
    pointerId !== undefined
) {

    try {

        canvas.setPointerCapture(
            pointerId
        );

    }
    catch (error) {

        // Pointer capture can fail.

    }

}


draw();

}

// ============================
// 星描画開始
// ============================

function startStarDrawing(
pos,
pointerId
) {

isDrawingStar =
    true;


selectedObject =
    null;


starPoints = [

    {
        x: pos.x,
        y: pos.y
    }

];


if (
    pointerId !== undefined
) {

    try {

        canvas.setPointerCapture(
            pointerId
        );

    }
    catch (error) {

        // Pointer capture can fail.

    }

}


draw();
}

// ============================
// pointerdown
// ============================

canvas.addEventListener(
"pointerdown",
function (event) {

    const pos =
        getCanvasPosition(event);


    const object =
        getObjectAt(
            pos.x,
            pos.y
        );


    // オブジェクトを選択

    if (object) {

        if (
            event.pointerType === "touch"
        ) {

            event.preventDefault();

        }


        selectedObject =
            object;


        draggingObject =
            object;


        canvas.setPointerCapture(
            event.pointerId
        );


        if (
            object.type === "text"
        ) {

            dragOffsetX =
                pos.x -
                object.x;

            dragOffsetY =
                pos.y -
                object.y;

        }
        else if (
            object.type === "arrow"
        ) {

            dragOffsetX =
                pos.x;

            dragOffsetY =
                pos.y;

        }
        else if (
            object.type === "star"
        ) {

            dragOffsetX =
                pos.x;

            dragOffsetY =
                pos.y;

        }


        draw();

        return;

    }


    // スマホ

    if (
        event.pointerType === "touch"
    ) {

        selectedObject =
            null;


        pendingArrowPointerId =
            event.pointerId;


        pendingArrowStartX =
            pos.x;

        pendingArrowStartY =
            pos.y;


        pendingArrowTimer =
            setTimeout(
                function () {

                    pendingArrowTimer =
                        null;


                    if (isStarMode) {

                        startStarDrawing(
                            {
                                x:
                                    pendingArrowStartX,

                                y:
                                    pendingArrowStartY
                            },

                            pendingArrowPointerId
                        );

                    }
                    else {

                        startArrowDrawing(
                            {
                                x:
                                    pendingArrowStartX,

                                y:
                                    pendingArrowStartY
                            },

                            pendingArrowPointerId
                        );

                    }


                    pendingArrowPointerId =
                        null;

                },
                100
            );


        draw();

        return;

    }


    // PC

    if (isStarMode) {

        startStarDrawing(
            pos,
            event.pointerId
        );

    }
    else {

        startArrowDrawing(
            pos,
            event.pointerId
        );

    }

}

);

// ============================
// pointermove
// ============================

canvas.addEventListener(
"pointermove",
function (event) {

    const pos =
        getCanvasPosition(event);


    // 長押し中

    if (
        pendingArrowPointerId ===
        event.pointerId
    ) {

        const distance =
            Math.hypot(
                pos.x -
                    pendingArrowStartX,

                pos.y -
                    pendingArrowStartY
            );


        if (distance > 8) {

            clearPendingArrow();

        }


        return;

    }


    // オブジェクト移動

    if (draggingObject) {

        if (
            draggingObject.type === "text"
        ) {

            draggingObject.x =
                pos.x -
                dragOffsetX;

            draggingObject.y =
                pos.y -
                dragOffsetY;

        }
        else if (
            draggingObject.type === "arrow"
        ) {

            const moveX =
                pos.x -
                dragOffsetX;

            const moveY =
                pos.y -
                dragOffsetY;


            draggingObject.startX +=
                moveX;

            draggingObject.startY +=
                moveY;


            draggingObject.endX +=
                moveX;

            draggingObject.endY +=
                moveY;


            dragOffsetX =
                pos.x;

            dragOffsetY =
                pos.y;

        }
        else if (
            draggingObject.type === "star"
        ) {

            const moveX =
                pos.x -
                dragOffsetX;

            const moveY =
                pos.y -
                dragOffsetY;


            draggingObject.points.forEach(
                function (point) {

                    point.x += moveX;
                    point.y += moveY;

                }
            );


            dragOffsetX =
                pos.x;

            dragOffsetY =
                pos.y;

        }


        draw();

        return;

    }


    // 矢印描画

    if (isDrawingArrow) {

        arrowEndX =
            pos.x;

        arrowEndY =
            pos.y;


        draw();

        return;

    }


    // 星描画

    if (isDrawingStar) {

        const lastPoint =
            starPoints[
                starPoints.length - 1
            ];


        const distance =
            Math.hypot(
                pos.x - lastPoint.x,
                pos.y - lastPoint.y
            );


        if (distance >= 5) {

            starPoints.push(
                {
                    x: pos.x,
                    y: pos.y
                }
            );

        }


        draw();

    }

}

);

// ============================
// pointerup
// ============================

canvas.addEventListener(
"pointerup",
function () {

    clearPendingArrow();


    // 移動終了

    if (draggingObject) {

        draggingObject =
            null;

        draw();

        return;

    }


    // 矢印終了

    if (isDrawingArrow) {

        isDrawingArrow =
            false;


        const distance =
            Math.hypot(
                arrowEndX -
                    arrowStartX,

                arrowEndY -
                    arrowStartY
            );


        if (distance >= 10) {

            const arrow = {

                type: "arrow",

                startX:
                    arrowStartX,

                startY:
                    arrowStartY,

                endX:
                    arrowEndX,

                endY:
                    arrowEndY,

                size:
                    Number(
                        arrowSizeSlider.value
                    ),

                color:
                    currentArrowColor

            };


            arrows.push(
                arrow
            );


            selectedObject =
                arrow;

        }


        draw();

        return;

    }


    // 星終了

    if (isDrawingStar) {

        isDrawingStar =
            false;


        if (
            starPoints.length >= 2
        ) {

            const star = {

                type: "star",

                points:
                    starPoints.map(
                        function (point) {

                            return {

                                x: point.x,

                                y: point.y

                            };

                        }
                    ),

                size:
                    Number(
                        arrowSizeSlider.value
                    ),

                color:
                    currentArrowColor

            };


            stars.push(
                star
            );


            selectedObject =
                star;

        }


        starPoints =
            [];


        draw();

    }

}

);

// ============================
// pointercancel
// ============================

canvas.addEventListener(
"pointercancel",
function () {

    clearPendingArrow();


    draggingObject =
        null;


    isDrawingArrow =
        false;


    isDrawingStar =
        false;


    starPoints =
        [];


    draw();

}

);

canvas.addEventListener(
"touchmove",
function (event) {

    if (
        draggingObject ||
        isDrawingArrow ||
        isDrawingStar
    ) {

        event.preventDefault();

    }

},
{
    passive: false
}

);

// ============================
// 文字サイズ
// ============================

textSizeSlider.addEventListener(
"input",
function () {

    if (!selectedObject) {
        return;
    }


    if (
        selectedObject.type !==
        "text"
    ) {

        return;

    }


    selectedObject.size =
        Number(
            textSizeSlider.value
        );


    draw();

}

);

// ============================
// 矢印・星サイズ
// ============================

arrowSizeSlider.addEventListener(
"input",
function () {

    if (!selectedObject) {
        return;
    }


    if (
        selectedObject.type ===
        "arrow" ||
        selectedObject.type ===
        "star"
    ) {

        selectedObject.size =
            Number(
                arrowSizeSlider.value
            );


        draw();

    }

}

);

// ============================
// 矢印回転
// ============================

function rotateArrow(degrees) {

if (!selectedObject) {
    return;
}


if (
    selectedObject.type !==
    "arrow"
) {

    return;

}


const arrow =
    selectedObject;


const centerX =
    (
        arrow.startX +
        arrow.endX
    ) / 2;


const centerY =
    (
        arrow.startY +
        arrow.endY
    ) / 2;


const radians =
    degrees *
    Math.PI /
    180;


function rotatePoint(
    x,
    y
) {

    const dx =
        x - centerX;

    const dy =
        y - centerY;


    return {

        x:
            centerX +
            dx * Math.cos(radians) -
            dy * Math.sin(radians),

        y:
            centerY +
            dx * Math.sin(radians) +
            dy * Math.cos(radians)

    };

}


const newStart =
    rotatePoint(
        arrow.startX,
        arrow.startY
    );


const newEnd =
    rotatePoint(
        arrow.endX,
        arrow.endY
    );


arrow.startX =
    newStart.x;

arrow.startY =
    newStart.y;


arrow.endX =
    newEnd.x;

arrow.endY =
    newEnd.y;


draw();

}

rotateLeftButton.addEventListener(
"pointerup",
function () {

    rotateArrow(-15);

}

);

rotateRightButton.addEventListener(
"pointerup",
function () {

    rotateArrow(15);

}

);

// ============================
// 削除
// ============================

function deleteSelected() {

if (!selectedObject) {
    return;
}


if (
    selectedObject.type ===
    "text"
) {

    const index =
        texts.indexOf(
            selectedObject
        );


    if (index !== -1) {

        texts.splice(
            index,
            1
        );

    }

}


if (
    selectedObject.type ===
    "arrow"
) {

    const index =
        arrows.indexOf(
            selectedObject
        );


    if (index !== -1) {

        arrows.splice(
            index,
            1
        );

    }

}


if (
    selectedObject.type ===
    "star"
) {

    const index =
        stars.indexOf(
            selectedObject
        );


    if (index !== -1) {

        stars.splice(
            index,
            1
        );

    }

}


selectedObject =
    null;


draw();

}

deleteButton.addEventListener(
"pointerup",
deleteSelected
);

// ============================
// Deleteキー
// ============================

document.addEventListener(
"keydown",
function (event) {

    if (
        event.key === "Delete" ||
        event.key === "Backspace"
    ) {

        if (
            document.activeElement.tagName ===
                "INPUT" ||
            document.activeElement.tagName ===
                "TEXTAREA"
        ) {

            return;

        }


        deleteSelected();

    }

}

);

// ============================
// 全削除
// ============================

clearButton.addEventListener(
"pointerup",
function () {

    texts = [];

    arrows = [];

    stars = [];


    selectedObject =
        null;


    draw();

}

);

// ============================
// 描画
// ============================

function draw() {

ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
);


// 画像

if (image) {

    ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
    );

}


// 矢印

arrows.forEach(
    function (arrow) {

        drawArrow(
            arrow,
            arrow ===
                selectedObject
        );

    }
);


// 星

stars.forEach(
    function (star) {

        drawStar(
            star,
            star ===
                selectedObject
        );

    }
);


// 描画中の矢印

if (isDrawingArrow) {

    drawArrow(
        {

            type: "arrow",

            startX:
                arrowStartX,

            startY:
                arrowStartY,

            endX:
                arrowEndX,

            endY:
                arrowEndY,

            size:
                Number(
                    arrowSizeSlider.value
                ),

            color:
                currentArrowColor

        },
        false
    );

}


// 描画中の星

if (
    isDrawingStar &&
    starPoints.length >= 2
) {

    drawStar(
        {

            type: "star",

            points:
                starPoints,

            size:
                Number(
                    arrowSizeSlider.value
                ),

            color:
                currentArrowColor

        },
        false
    );

}


// テキスト

texts.forEach(
    function (text) {

        drawText(
            text,
            text ===
                selectedObject
        );

    }
);

}

// ============================
// テキスト描画
// ============================

function drawText(
text,
selected
) {


const color =
    text.color ||
    currentTextColor ||
    "#ffffff";


ctx.font =
    `bold ${text.size}px sans-serif`;


ctx.textAlign =
    "center";

ctx.textBaseline =
    "bottom";


// 選択枠

if (selected) {

    const width =
        ctx.measureText(
            text.text
        ).width;


    ctx.strokeStyle =
        "#4ddfff";


    ctx.lineWidth =
        3;


    ctx.setLineDash(
        [8, 5]
    );


    ctx.strokeRect(

        text.x -
            width / 2 -
            8,

        text.y -
            text.size -
            8,

        width + 16,

        text.size + 16

    );


    ctx.setLineDash([]);

}


// 黒い縁取り

ctx.lineWidth =
    8;


ctx.strokeStyle =
    "black";


ctx.strokeText(
    text.text,
    text.x,
    text.y
);


// 文字

ctx.fillStyle =
    color;


ctx.fillText(
    text.text,
    text.x,
    text.y
);
}

// ============================
// 矢印描画
// ============================

function drawArrow(
arrow,
selected
) {

const color =
    arrow.color ||
    currentArrowColor ||
    "#ff0000";


const dx =
    arrow.endX -
    arrow.startX;


const dy =
    arrow.endY -
    arrow.startY;


const angle =
    Math.atan2(
        dy,
        dx
    );


const length =
    Math.hypot(
        dx,
        dy
    );


const size =
    arrow.size;


const headLength =
    size * 3;


const headBaseX =
    arrow.endX -
    headLength *
        Math.cos(angle);


const headBaseY =
    arrow.endY -
    headLength *
        Math.sin(angle);


ctx.save();


// 選択表示

if (selected) {

    ctx.strokeStyle =
        "#4ddfff";

    ctx.lineWidth =
        size + 8;

    ctx.globalAlpha =
        0.5;


    ctx.beginPath();


    ctx.moveTo(
        arrow.startX,
        arrow.startY
    );


    ctx.lineTo(
        headBaseX,
        headBaseY
    );


    ctx.stroke();


    ctx.globalAlpha =
        1;

}


// 棒

ctx.strokeStyle =
    color;

ctx.lineWidth =
    size;

ctx.lineCap =
    "round";


ctx.beginPath();


ctx.moveTo(
    arrow.startX,
    arrow.startY
);


ctx.lineTo(
    headBaseX,
    headBaseY
);


ctx.stroke();


// 三角形

ctx.fillStyle =
    color;


const sideLength =
    headLength * 0.55;


const leftX =
    headBaseX -
    sideLength *
        Math.cos(
            angle -
            Math.PI / 2
        );


const leftY =
    headBaseY -
    sideLength *
        Math.sin(
            angle -
            Math.PI / 2
        );


const rightX =
    headBaseX -
    sideLength *
        Math.cos(
            angle +
            Math.PI / 2
        );


const rightY =
    headBaseY -
    sideLength *
        Math.sin(
            angle +
            Math.PI / 2
        );


ctx.beginPath();


ctx.moveTo(
    arrow.endX,
    arrow.endY
);


ctx.lineTo(
    leftX,
    leftY
);


ctx.lineTo(
    rightX,
    rightY
);


ctx.closePath();


ctx.fill();


// 選択ハンドル

if (selected) {

    ctx.strokeStyle =
        "#4ddfff";

    ctx.fillStyle =
        "white";

    ctx.lineWidth =
        4;

    ctx.setLineDash(
        [10, 7]
    );


    ctx.beginPath();


    ctx.moveTo(
        arrow.startX,
        arrow.startY
    );


    ctx.lineTo(
        arrow.endX,
        arrow.endY
    );


    ctx.stroke();


    ctx.setLineDash([]);

}


ctx.restore();

}

// ============================
// 星描画
// ============================

function drawStar(
star,
selected
) {

if (
    !star.points ||
    star.points.length < 2
) {

    return;

}


const color =
    star.color ||
    currentArrowColor ||
    "#ff0000";


ctx.save();


/*
 * 星モードでは、なぞった場所に
 * 一定間隔で星を配置する
 */

const spacing =
    Math.max(
        15,
        star.size * 4
    );


let distanceFromLastStar =
    Infinity;


let previousPoint =
    star.points[0];


for (
    let i = 1;
    i < star.points.length;
    i++
) {

    const currentPoint =
        star.points[i];


    const dx =
        currentPoint.x -
        previousPoint.x;

    const dy =
        currentPoint.y -
        previousPoint.y;


    const segmentLength =
        Math.hypot(
            dx,
            dy
        );


    if (
        segmentLength === 0
    ) {

        continue;

    }


    const angle =
        Math.atan2(
            dy,
            dx
        );


    let travelled =
        0;


    while (
        travelled <=
        segmentLength
    ) {

        const x =
            previousPoint.x +
            Math.cos(angle) *
                travelled;

        const y =
            previousPoint.y +
            Math.sin(angle) *
                travelled;


        if (
            distanceFromLastStar >=
            spacing
        ) {

            drawSmallStar(
                x,
                y,
                star.size,
                color
            );


            distanceFromLastStar =
                0;

        }


        const remaining =
            segmentLength -
            travelled;


        const step =
            Math.min(
                spacing -
                    distanceFromLastStar,

                remaining
            );


        travelled +=
            Math.max(
                step,
                0.1
            );


        distanceFromLastStar +=
            step;

    }


    previousPoint =
        currentPoint;

}


// 選択表示

if (selected) {

    ctx.strokeStyle =
        "#4ddfff";

    ctx.lineWidth =
        star.size + 5;

    ctx.globalAlpha =
        0.35;

    ctx.setLineDash(
        [10, 7]
    );


    ctx.beginPath();


    ctx.moveTo(
        star.points[0].x,
        star.points[0].y
    );


    for (
        let i = 1;
        i < star.points.length;
        i++
    ) {

        ctx.lineTo(
            star.points[i].x,
            star.points[i].y
        );

    }


    ctx.stroke();


    ctx.setLineDash([]);

}


ctx.restore();
}

// ============================
// 小さい星
// ============================

function drawSmallStar(
x,
y,
size,
color
) {

const outerRadius =
    Math.max(
        3,
        size * 1.6
    );


const innerRadius =
    outerRadius * 0.42;


ctx.fillStyle =
    color;


ctx.beginPath();


for (
    let i = 0;
    i < 10;
    i++
) {

    const angle =
        -Math.PI / 2 +
        i *
            Math.PI /
            5;


    const radius =
        i % 2 === 0
            ? outerRadius
            : innerRadius;


    const px =
        x +
        Math.cos(angle) *
            radius;


    const py =
        y +
        Math.sin(angle) *
            radius;


    if (i === 0) {

        ctx.moveTo(
            px,
            py
        );

    }
    else {

        ctx.lineTo(
            px,
            py
        );

    }

}


ctx.closePath();

ctx.fill();


}

// ============================
// 色変更
// ============================

textColorInput.addEventListener(
"input",
function (e) {

    currentTextColor =
        e.target.value;


    if (!selectedObject) {
        return;
    }


    if (
        selectedObject.type ===
        "text"
    ) {

        selectedObject.color =
            currentTextColor;


        draw();

    }

}

);

arrowColorInput.addEventListener(
"input",
function (e) {

    currentArrowColor =
        e.target.value;


    if (!selectedObject) {
        return;
    }


    if (
        selectedObject.type ===
            "arrow" ||
        selectedObject.type ===
            "star"
    ) {

        selectedObject.color =
            currentArrowColor;


        draw();

    }

}

);

// ============================
// 保存
// ============================

saveButton.addEventListener(
"pointerup",
function () {

    if (!image) {

        alert(
            t("selectImageFirst")
        );

        return;

    }


    const oldSelected =
        selectedObject;


    selectedObject =
        null;


    draw();


    const imageData =
        canvas.toDataURL(
            "image/png"
        );


    sessionStorage.setItem(
        "oshiKokoMiteImage",
        imageData
    );


    selectedObject =
        oldSelected;


    draw();


    window.location.href =
        "download.html";

}

);

// ============================
// 初期Canvas
// ============================

canvas.width =
800;

canvas.height =
500;

updateCanvasDisplaySize();

draw();

window.addEventListener(
"resize",
updateCanvasDisplaySize
);

// ============================
// 更新履歴
// ============================

const UpdateHistory_button =
document.getElementById(
"UpdateHistory_button"
);

UpdateHistory_button.addEventListener(
"pointerup",
function () {

    window.open(
        `UpdateHistory.html?lang=${currentLanguage}`,
        "_blank"
    );

}

);
