window.onload = function () {
    // ページ読み込み時に実行したい処理
    initialize();
}

function initialize() {
    setTitle();
    setTable();
    document.getElementById('allSelect').addEventListener('click', selectAllLinks);
    document.getElementById('delete').addEventListener('click', deleteLink);
    TABLE = document.getElementById("linksTable");
    chrome.storage.onChanged.addListener
        ((changes) => {
            console.log(changes);
            setTable();
        });
}

function setTitle() {
    let manifest = chrome.runtime.getManifest();
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("version").innerText = manifest.version;
}


let TABLE;
//let CHECKBOX_ROW_INDEX = 0;
let CHECKBOX_IDS = [];
function setTable() {
    chrome.storage.local.get(function (items) {
        // テーブルのクリア
        while (TABLE.rows[1]) TABLE.deleteRow(1);

        let length = items['length'];
        if (!Number(length)) {
            length = 1;
        }

        CHECKBOX_IDS = [];
        // テーブルの生成
        // itemsは1からのオブジェクト
        // TODO:chrome.storageのArray登録すれば無駄にfor文回さなくて済む
        for (let index = 1; index < length + 1; index++) {
            if (items[index]) {
                let newtr = TABLE.insertRow(TABLE.rows.length);

                let selecttd = newtr.insertCell(newtr.cells.length);

                // チェックボックスの作成
                let checkbox = document.createElement('input');
                //checkbox.type('checkbox')
                checkbox.setAttribute("type", "checkbox");
                var id = "checkbox" + index;
                //CHECKBOX_IDS[index] = (id);
                CHECKBOX_IDS.push(id);
                checkbox.setAttribute('id', id);
                checkbox.setAttribute('name', 'links');
                checkbox.setAttribute('click', deleteLink);
                selecttd.appendChild(checkbox);

                let linktd = newtr.insertCell(newtr.cells.length);
                linktd.innerHTML = items[index];

                newtr.addEventListener('click', selectLink);

                /*取れない
                chrome.storage.local.get(String(index), function (item) {
                    newtd1.innerHTML = item.key;
                });
                */
            }
        }
    });
}

function selectLink(event) {
    // trから直接checkbox制御はできなかった、
    //let cell = event.currentTarget.cells[CHECKBOX_ROW_INDEX];
    //cell.checkbox.checked = true;
    // linksが定義されてないと怒られる
    //let checkbox = document.linksTable.links[event.currentTarget.rowIndex];

    let id = CHECKBOX_IDS[event.currentTarget.rowIndex - 1];
    let checkbox = document.getElementById(id);

    if (event.target.type !== 'checkbox')
        checkbox.checked = checkbox.checked ? false : true;
}

function selectAllLinks(event) {

}

function deleteLink(event) {
    /*
    for (let i = 0; i < CHECKBOX_IDS.length; i++) {
        if (document.getElementById(CHECKBOX_IDS[i]).checked) {
            table.deleteRow(i);
            // CHECKBOXの削除
            //background.jsで使うリンクの削除
        }
    }
    */
    let deleteIdIndexs = new Array();
    for (let i = 0; i < CHECKBOX_IDS.length; i++) {
        if (document.getElementById(CHECKBOX_IDS[i]).checked) {
            deleteIdIndexs.push(i + 1);
            //background.jsで使うリンクの削除
        }
    }

    for (var i = 0; i < deleteIdIndexs.length; i++) {
        TABLE.deleteRow(deleteIdIndexs[i]);
        CHECKBOX_IDS.splice(deleteIdIndexs[i] - 1, 1);
        chrome.storage.local.remove(deleteIdIndexs[i] + "", function () { }); // 上の作業はcallbackにしてもいいかも

    }
}



// ｈ１などのタグができる前に登録してしまう
//document.getElementById('all-select').addEventListener('click',selectLink);
/*
// Saves options to chrome.storage
function save_options() {
    let color = document.getElementById('color').value;
    let likesColor = document.getElementById('like').checked;
    chrome.storage.sync.set({
        favoriteColor: color,
        likesColor: likesColor
    }, function () {
        // Update status to let user know options were saved.
        let status = document.getElementById('status');
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
    let wOut = '';

    // --- クリックされたエレメントを取得 ------------
    let wElement = (argEnv.srcElement || argEnv.target);

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