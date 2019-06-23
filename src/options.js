window.onload = function () {
    // ページ読み込み時に実行したい処理
    initialize();
}

function initialize() {
    setTitle();
    setTable();
    document.getElementById('allSelect').addEventListener('click', selectLink);
    document.getElementById('delete').addEventListener('click', deleteLink);
}

function setTitle() {
    var manifest = chrome.runtime.getManifest();
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("version").innerText = manifest.version;
}

function setTable() {
    chrome.storage.local.get(function (items) {
        // lenghtでリンク数とってこれるようにしておけばよかったな
        var length = Object.keys(items).length;
        if (Number(length)) {
            length++;
        } else {
            length = 1;
        }

        // テーブル生成中
        var table = document.getElementById("linksTable");

        for (var i = 1; i < length + 1; i++) {
            chrome.storage.local.get(i, function (item) {
                var a = item.key;
            });
        }
    });
}

function selectLink() {
    // チェックボックスの制御
}

function deleteLink() {
    //background.jsとの連携
}



// ｈ１などのタグができる前に登録してしまう
//document.getElementById('all-select').addEventListener('click',selectLink);
/*
// Saves options to chrome.storage
function save_options() {
    var color = document.getElementById('color').value;
    var likesColor = document.getElementById('like').checked;
    chrome.storage.sync.set({
        favoriteColor: color,
        likesColor: likesColor
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        favoriteColor: 'red',
        likesColor: true
    }, function (items) {
        document.getElementById('color').value = items.favoriteColor;
        document.getElementById('like').checked = items.likesColor;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
*/
/*
    "options_ui": {
        "page": "options.html",
        "chrome_style": true,
        "open_in_tab": false
    },
    */

function tableClick(argEnv) {
    // ===================================================
    //  ○ クリック時の位置と値の取得 ○
    //
    //  tableのクリック位置と値を取得するサンプルです
    //  （行と列はTRなども含んだ、0からの値です）
    // ====================================================
    var wOut = '';

    // --- クリックされたエレメントを取得 ------------
    var wElement = (argEnv.srcElement || argEnv.target);

    // --- TDのみ対象とする --------------------------
    if (wElement.tagName.toUpperCase() == 'TD') {

        // --- 行・列・値の取得＆編集 ------------------
        wOut += '行:' + wElement.cellIndex + '&nbsp;&nbsp;';
        wOut += '列:' + wElement.parentNode.sectionRowIndex + '&nbsp;&nbsp;';
        wOut += '値:' + wElement.innerHTML;

        // --- 結果表示 ------------------------------
        document.getElementById("clickKekka").innerHTML = wOut;

    }
}