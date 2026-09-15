const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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


// ============================
// データ
// ============================

let image = null;

let texts = [];
let arrows = [];

let selectedObject = null;

let currentTextColor = textColorInput.value || "#ffffff";
let currentArrowColor = arrowColorInput.value || "#ff0000";

let draggingObject = null;

let dragOffsetX = 0;
let dragOffsetY = 0;

let isDrawingArrow = false;
let pendingArrowTimer = null;
let pendingArrowPointerId = null;
let pendingArrowStartX = 0;
let pendingArrowStartY = 0;

let arrowStartX = 0;
let arrowStartY = 0;

let arrowEndX = 0;
let arrowEndY = 0;


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

            texts = [];
            arrows = [];

            selectedObject = null;

            draw();
        };

        image.src = event.target.result;
    };

    reader.readAsDataURL(file);

});


// ============================
// テキスト追加
// ============================

addTextButton.addEventListener("pointerup", function () {

    addText("ここ好き！");

});


addCustomTextButton.addEventListener("pointerup", function () {


    if (!image) {

        alert("先に画像を選択してください");

        return;
    }

    const overlay = document.getElementById("overlay");
    const inputUI = document.getElementById("inputUI");

    overlay.style.display = "block";
    inputUI.style.display = "flex";

});

//テキスト追加
const addText_button = document.getElementById("addText_button");
addText_button.addEventListener("pointerup", () => {
    
    const overlay = document.getElementById("overlay");
    const inputUI = document.getElementById("inputUI");
    const userText_area = document.getElementById("userText_area");

    if(userText_area.value.trim().length === 0)
    {
        return;
    }
    addText(userText_area.value);
    overlay.style.display = "none";
    inputUI.style.display = "none";
    userText_area.value = "";
});

//ダイアログキャンセル
const cansel_dialog = document.getElementById("cansel_dialog");
cansel_dialog.addEventListener("pointerup", () => {
    
    const overlay = document.getElementById("overlay");
    const inputUI = document.getElementById("inputUI");
    const userText_area = document.getElementById("userText_area");

    overlay.style.display = "none";
    inputUI.style.display = "none";
    userText_area.value = "";
});


function addText(textValue) {

    if (!image) {

        alert("先に画像を選択してください");

        return;
    }

    const text = {

        type: "text",

        text: textValue,

        x: canvas.width / 2,

        y: canvas.height / 2,

        size: Number(textSizeSlider.value),

        color: currentTextColor

    };

    texts.push(text);

    selectedObject = text;

    draw();

}


// ============================
// Canvas座標
// ============================

function getCanvasPosition(event) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {

        x: (event.clientX - rect.left) * scaleX,

        y: (event.clientY - rect.top) * scaleY

    };

}


// ============================
// オブジェクト検索
// ============================

function getObjectAt(x, y) {

    // テキスト
    for (let i = texts.length - 1; i >= 0; i--) {

        const text = texts[i];

        ctx.font = `bold ${text.size}px sans-serif`;

        const width = ctx.measureText(text.text).width;

        const height = text.size;

        if (
            x >= text.x - width / 2 &&
            x <= text.x + width / 2 &&
            y >= text.y - height &&
            y <= text.y + 5
        ) {

            return text;
        }
    }


    // 矢印
    for (let i = arrows.length - 1; i >= 0; i--) {

        const arrow = arrows[i];

        if (isNearLine(
            x,
            y,
            arrow.startX,
            arrow.startY,
            arrow.endX,
            arrow.endY,
            arrow.size + 15
        )) {

            return arrow;
        }
    }

    return null;
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

    const dx = x2 - x1;
    const dy = y2 - y1;

    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        return false;
    }

    let t =
        ((px - x1) * dx + (py - y1) * dy)
        / lengthSquared;

    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    const distance = Math.hypot(
        px - closestX,
        py - closestY
    );

    return distance <= tolerance;
}

function clearPendingArrow() {

    if (pendingArrowTimer) {

        clearTimeout(pendingArrowTimer);
        pendingArrowTimer = null;

    }

    pendingArrowPointerId = null;

}


function startArrowDrawing(pos, pointerId) {

    isDrawingArrow = true;

    selectedObject = null;

    arrowStartX = pos.x;
    arrowStartY = pos.y;

    arrowEndX = pos.x;
    arrowEndY = pos.y;

    if (pointerId !== undefined) {

        try {

            canvas.setPointerCapture(pointerId);

        }
        catch (error) {

            // Pointer capture can fail if the browser has already turned the touch into a scroll.

        }

    }

    draw();

}


// ============================
// pointerdown
// ============================

canvas.addEventListener("pointerdown", function (event) {

    const pos = getCanvasPosition(event);

    const object = getObjectAt(
        pos.x,
        pos.y
    );


    // オブジェクトを選択
    if (object) {

        if (event.pointerType === "touch") {
            event.preventDefault();
        }

        selectedObject = object;

        draggingObject = object;

        canvas.setPointerCapture(event.pointerId);


        if (object.type === "text") {

            dragOffsetX = pos.x - object.x;
            dragOffsetY = pos.y - object.y;

        }
        else if (object.type === "arrow") {

            dragOffsetX = pos.x;
            dragOffsetY = pos.y;

        }

        draw();

        return;
    }


    // スマホでは空白部分のドラッグをスクロールに譲り、長押しだけ矢印描画にする
    if (event.pointerType === "touch") {

        selectedObject = null;

        pendingArrowPointerId = event.pointerId;
        pendingArrowStartX = pos.x;
        pendingArrowStartY = pos.y;

        pendingArrowTimer = setTimeout(function () {

            pendingArrowTimer = null;

            startArrowDrawing(
                {
                    x: pendingArrowStartX,
                    y: pendingArrowStartY
                },
                pendingArrowPointerId
            );

            pendingArrowPointerId = null;

        }, 150);

        draw();

        return;

    }


    // PCでは何もない場所のドラッグで矢印描画
    startArrowDrawing(pos, event.pointerId);

});


// ============================
// pointermove
// ============================

canvas.addEventListener("pointermove", function (event) {

    const pos = getCanvasPosition(event);


    if (pendingArrowPointerId === event.pointerId) {

        const distance = Math.hypot(
            pos.x - pendingArrowStartX,
            pos.y - pendingArrowStartY
        );

        if (distance > 8) {
            clearPendingArrow();
        }

        return;

    }


    // オブジェクト移動
    if (draggingObject) {

        if (draggingObject.type === "text") {

            draggingObject.x =
                pos.x - dragOffsetX;

            draggingObject.y =
                pos.y - dragOffsetY;

        }
        else if (draggingObject.type === "arrow") {

            const moveX =
                pos.x - dragOffsetX;

            const moveY =
                pos.y - dragOffsetY;

            draggingObject.startX += moveX;
            draggingObject.startY += moveY;

            draggingObject.endX += moveX;
            draggingObject.endY += moveY;

            dragOffsetX = pos.x;
            dragOffsetY = pos.y;

        }

        draw();

        return;
    }


    // 矢印描画
    if (isDrawingArrow) {

        arrowEndX = pos.x;
        arrowEndY = pos.y;

        draw();

    }

});


// ============================
// pointerup
// ============================

canvas.addEventListener("pointerup", function () {

    clearPendingArrow();

    // 移動終了
    if (draggingObject) {

        draggingObject = null;

        draw();

        return;
    }


    // 矢印終了
    if (isDrawingArrow) {

        isDrawingArrow = false;

        const distance = Math.hypot(
            arrowEndX - arrowStartX,
            arrowEndY - arrowStartY
        );


        if (distance >= 10) {

            const arrow = {

                type: "arrow",

                startX: arrowStartX,
                startY: arrowStartY,

                endX: arrowEndX,
                endY: arrowEndY,

                size: Number(arrowSizeSlider.value),

                color: currentArrowColor

            };

            arrows.push(arrow);

            selectedObject = arrow;

        }

        draw();

    }

});


canvas.addEventListener("pointercancel", function () {

    clearPendingArrow();

    draggingObject = null;
    isDrawingArrow = false;

    draw();

});


canvas.addEventListener("touchmove", function (event) {

    if (draggingObject || isDrawingArrow) {
        event.preventDefault();
    }

}, { passive: false });


// ============================
// 文字サイズ
// ============================

textSizeSlider.addEventListener("input", function () {

    if (!selectedObject) {
        return;
    }

    if (selectedObject.type !== "text") {
        return;
    }

    selectedObject.size =
        Number(textSizeSlider.value);

    draw();

});


// ============================
// 矢印サイズ
// ============================

arrowSizeSlider.addEventListener("input", function () {

    if (!selectedObject) {
        return;
    }

    if (selectedObject.type !== "arrow") {
        return;
    }

    selectedObject.size =
        Number(arrowSizeSlider.value);

    draw();

});


// ============================
// 矢印回転
// ============================

function rotateArrow(degrees) {

    if (!selectedObject) {
        return;
    }

    if (selectedObject.type !== "arrow") {
        return;
    }

    const arrow = selectedObject;

    const centerX =
        (arrow.startX + arrow.endX) / 2;

    const centerY =
        (arrow.startY + arrow.endY) / 2;


    const radians =
        degrees * Math.PI / 180;


    function rotatePoint(x, y) {

        const dx = x - centerX;
        const dy = y - centerY;

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


    arrow.startX = newStart.x;
    arrow.startY = newStart.y;

    arrow.endX = newEnd.x;
    arrow.endY = newEnd.y;


    draw();

}


rotateLeftButton.addEventListener("pointerup", function () {

    rotateArrow(-15);

});


rotateRightButton.addEventListener("pointerup", function () {

    rotateArrow(15);

});


// ============================
// 削除
// ============================

function deleteSelected() {

    if (!selectedObject) {
        return;
    }


    if (selectedObject.type === "text") {

        const index =
            texts.indexOf(selectedObject);

        if (index !== -1) {

            texts.splice(index, 1);

        }

    }


    if (selectedObject.type === "arrow") {

        const index =
            arrows.indexOf(selectedObject);

        if (index !== -1) {

            arrows.splice(index, 1);

        }

    }


    selectedObject = null;

    draw();

}


deleteButton.addEventListener(
    "click",
    deleteSelected
);


// ============================
// Deleteキー
// ============================

document.addEventListener("keydown", function (event) {

    if (
        event.key === "Delete" ||
        event.key === "Backspace"
    ) {

        if (
            document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA"
        ) {
            return;
        }

        deleteSelected();

    }

});


// ============================
// 全削除
// ============================

clearButton.addEventListener("pointerup", function () {

    texts = [];

    arrows = [];

    selectedObject = null;

    draw();

});


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
    arrows.forEach(function (arrow) {

        drawArrow(
            arrow,
            arrow === selectedObject
        );

    });


    // 描画中の矢印
    if (isDrawingArrow) {

        drawArrow({

            type: "arrow",

            startX: arrowStartX,
            startY: arrowStartY,

            endX: arrowEndX,
            endY: arrowEndY,

            size: Number(arrowSizeSlider.value),

            color: currentArrowColor

        }, false);

    }


    // テキスト
    texts.forEach(function (text) {

        drawText(
            text,
            text === selectedObject
        );

    });

}


// ============================
// テキスト描画
// ============================

function drawText(text, selected) {

    const color = text.color || currentTextColor || "#ffffff";

    ctx.font =
        `bold ${text.size}px sans-serif`;

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";


    // 選択枠
    if (selected) {

        const width =
            ctx.measureText(text.text).width;

        ctx.strokeStyle = "#4ddfff";

        ctx.lineWidth = 3;

        ctx.setLineDash([8, 5]);

        ctx.strokeRect(

            text.x - width / 2 - 8,

            text.y - text.size - 8,

            width + 16,

            text.size + 16

        );

        ctx.setLineDash([]);

    }


    // 黒い縁取り
    ctx.lineWidth = 8;

    ctx.strokeStyle = "black";

    ctx.strokeText(
        text.text,
        text.x,
        text.y
    );


    // 文字
    ctx.fillStyle = color;

    ctx.fillText(
        text.text,
        text.x,
        text.y
    );

}


// ============================
// 矢印描画
// ============================

function drawArrow(arrow, selected) {

    const color = arrow.color || currentArrowColor || "#ff0000";

    const dx =
        arrow.endX - arrow.startX;

    const dy =
        arrow.endY - arrow.startY;

    const angle =
        Math.atan2(dy, dx);


    // 矢印の長さ
    const length =
        Math.hypot(dx, dy);


    // 矢印のサイズ
    const size = arrow.size;


    // 三角形の長さ
    const headLength =
        size * 3;


    // 三角形の根元
    const headBaseX =
        arrow.endX -
        headLength * Math.cos(angle);

    const headBaseY =
        arrow.endY -
        headLength * Math.sin(angle);


    ctx.save();


    // ========================
    // 選択表示
    // ========================

    if (selected) {

        ctx.strokeStyle = "#4ddfff";

        ctx.lineWidth =
            size + 8;

        ctx.globalAlpha = 0.5;

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

        ctx.globalAlpha = 1;

    }


    // ========================
    // 棒
    // ========================

    ctx.strokeStyle = color;

    ctx.lineWidth = size;

    ctx.lineCap = "round";

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


    // ========================
    // 三角形
    // ========================

    ctx.fillStyle = color;

    const sideLength =
        headLength * 0.55;


    const leftX =
        headBaseX -
        sideLength *
        Math.cos(angle - Math.PI / 2);

    const leftY =
        headBaseY -
        sideLength *
        Math.sin(angle - Math.PI / 2);


    const rightX =
        headBaseX -
        sideLength *
        Math.cos(angle + Math.PI / 2);

    const rightY =
        headBaseY -
        sideLength *
        Math.sin(angle + Math.PI / 2);


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


    ctx.restore();

}


// ============================
// 色変更
// ============================

textColorInput.addEventListener("input", function (e) {

    currentTextColor = e.target.value;


    if (!selectedObject) {
        return;
    }


    // 選択中がテキストならテキストだけ変更
    if (selectedObject.type === "text") {

        selectedObject.color = currentTextColor;

        draw();

    }

});


arrowColorInput.addEventListener("input", function (e) {

    currentArrowColor = e.target.value;


    if (!selectedObject) {
        return;
    }


    // 選択中が矢印なら矢印だけ変更
    if (selectedObject.type === "arrow") {

        selectedObject.color = currentArrowColor;

        draw();

    }

});


// ============================
// 保存
// ============================

saveButton.addEventListener("pointerup", function () {

    if (!image) {

        alert("先に画像を選択してください");

        return;
    }


    // 選択状態を一時的に解除
    const oldSelected =
        selectedObject;

    selectedObject = null;

    draw();


    // Canvasを画像データに変換
    const imageData =
        canvas.toDataURL("image/png");


    // 保存ページへ渡す
    sessionStorage.setItem(
        "oshiKokoMiteImage",
        imageData
    );


    // 元の選択状態に戻す
    selectedObject =
        oldSelected;


    draw();


    // 保存ページへ移動
    window.location.href =
        "download.html";

});


// ============================
// 初期Canvas
// ============================

canvas.width = 800;
canvas.height = 500;

draw();


//更新履歴
const UpdateHistory_button = document.getElementById("UpdateHistory_button");
UpdateHistory_button.addEventListener("pointerup", () =>{

    window.open("UpdateHistory.html", "_blank");
});