window.onload = function () {
    // ページ読み込み時に実行したい処理
    initialize();
}

let TABLE;
function initialize() {
    setTitle();
    setTable();
    document.getElementById('copy').addEventListener('click', copyLinks);
    document.getElementById('allSelect').addEventListener('click', selectAllLinks);
    document.getElementById('delete').addEventListener('click', deleteLink);
    TABLE = document.getElementById("linksTable");
    chrome.storage.onChanged.addListener
        ((changes) => {
            console.log(changes);
            setTable();
        });
}

function copyLinks(event) {
    getChromeStorage().then(
        response => {
            copyToClipBoard(response);
        }
    )
}

// TODO:関数共通化
function copyToClipBoard(items) {
    let text = '';
    /*
                for (let i = 1; i < Object.keys(items).length + 1; i++) {
                    console.log('set:' + items[String(i)]);
                    text += items[String(i)];
                }
    */
    Object.keys(items).forEach(function (key) {
        if (key !== 'length') {
            console.log('set:' + items[key]);
            text += (items[key] + '  \n');
        }
    });

    // テキストエリアを作って値を入れる
    let ta = document.createElement('textarea');
    let st = ta.style;
    st.position = 'fixed';
    st.left = '-100%';
    ta.value = text;

    // 作成したテキストエリアをbody要素に追加
    document.body.appendChild(ta);

    // テキストエリアを選択
    ta.select();

    // クリップボードにコピー
    let result = document.execCommand('copy');

    // body要素から作成したテキストエリアを削除
    document.body.removeChild(ta);

    return result;
}

function setTitle() {
    let manifest = chrome.runtime.getManifest();
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("version").innerText = manifest.version;
}

// checkboxIDとLinkのIDは同一
let CHECKBOX_IDS = [];
function setTable() {
    getChromeStorage().then(
        response => {
            let items = response;
            // テーブルのクリア
            while (TABLE.rows[1]) TABLE.deleteRow(1);

            var r1Checked = document.getElementById("r1").checked;

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
                    var id = index;
                    //CHECKBOX_IDS[index] = (id);
                    CHECKBOX_IDS.push(id);
                    checkbox.setAttribute('id', id);
                    checkbox.setAttribute('name', 'links');
                    checkbox.setAttribute('click', deleteLink);
                    selecttd.appendChild(checkbox);

                    let linktd = newtr.insertCell(newtr.cells.length);
                    linktd.innerHTML = items[index];

                    newtr.addEventListener('click', selectLinks);

                    /*取れない
                    chrome.storage.local.get(String(index), function (item) {
                        newtd1.innerHTML = item.key;
                    });
                    */
                }

            }
        }
    );
}

function checkLink(index) {
    let id = CHECKBOX_IDS[index - 1];
    let checkbox = document.getElementById(id);

    if (event.target.type !== 'checkbox')
        checkbox.checked = checkbox.checked ? false : true;
}

function selectLinks(event) {
    // trから直接checkbox制御はできなかった、
    //let cell = event.currentTarget.cells[CHECKBOX_ROW_INDEX];
    //cell.checkbox.checked = true;
    // linksが定義されてないと怒られる
    //let checkbox = document.linksTable.links[event.currentTarget.rowIndex];

    checkLink(event.currentTarget.rowIndex);
}

function selectAllLinks(event) {
    for (let i = 1; i < TABLE.rows.length; i++) {
        checkLink(i);
    }
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
            // TODO:引数をArrayにする
            chrome.storage.local.remove(CHECKBOX_IDS[i] + "");
            deleteIdIndexs.push(i + 1);
        }
    }

    for (var i = 0; i < deleteIdIndexs.length; i++) {
        //chrome.storage.localの変化でイベントハンドラでテーブル操作する
        //TABLE.deleteRow(deleteIdIndexs[i]);
        CHECKBOX_IDS.splice(deleteIdIndexs[i] - 1, 1);
        // TODO:上の作業はcallbackにしてもいいかも
    }
}
// TODO:非同期にするのだ
function getChromeStorage(keys = null) {
    return new Promise(resolve => {
        chrome.storage.local.get(keys, resolve);
    });
}

function setChromeStorage(items) {
    return new Promise(resolve => {
        chrome.storage.local.set(items, resolve);
    });
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