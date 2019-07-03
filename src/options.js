const LINKS_STORAGE_KEY = 'links';

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
            // TODO:テーブル追加・削除だけしたい
            //table.deleteRow(i);
        });
}

function copyLinks(event) {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        response => {
            copyToClipBoard(response[LINKS_STORAGE_KEY]);
        }
    )
}

// TODO:関数共通化
function copyToClipBoard(links) {
    let text = '';
    for (let i = 0; i < links.length; i++) {
        console.log('set:' + links[i]);
        text += (links[i] + '  \n');
    }

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
}

function setTitle() {
    let manifest = chrome.runtime.getManifest();
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("version").innerText = manifest.version;
}

function setTable() {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        response => {
            let links = response[LINKS_STORAGE_KEY];
            // テーブルのクリア
            while (TABLE.rows[1]) TABLE.deleteRow(1);

            // TODO:ストックコピー設定か見て、テーブル作成判断
            let r1Checked = document.getElementById("r1").checked;

            // テーブルの生成
            for (let i = 0; i < links.length; i++) {
                let newtr = TABLE.insertRow(TABLE.rows.length);
                let selecttd = newtr.insertCell(newtr.cells.length);

                // チェックボックスの作成
                let checkbox = document.createElement('input');
                //checkbox.type('checkbox')
                checkbox.setAttribute("type", "checkbox");
                var id = i + 1;
                checkbox.setAttribute('id', id);
                //checkbox.setAttribute('name', 'links');
                checkbox.setAttribute('click', deleteLink);
                selecttd.appendChild(checkbox);

                let linktd = newtr.insertCell(newtr.cells.length);
                linktd.innerHTML = links[i];

                newtr.addEventListener('click', selectLinks);
            }
            // itemsは1からのオブジェクト
            // TODO:chrome.storageのArray登録すれば無駄にfor文回さなくて済む
        }
    );
}

function checkLink(index) {
    let id = index;
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
    getChromeStorage(LINKS_STORAGE_KEY).then(
        response => {
            let newLinks = response[LINKS_STORAGE_KEY].filter(
                function (value, index) {
                    if (!document.getElementById(index + 1).checked)
                        return value;
                });

            return newLinks;
        }
    )
        .then(
            response => {
                setLinks(response);
            }
        )
    /*
        for (let i = 1; i < TABLE.rows.length; i++) {
            if (document.getElementById(i).checked) {
            }
        }
    
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
        */
}

async function setLinks(links) {
    let linksSetting = {};
    linksSetting[LINKS_STORAGE_KEY] = links;
    await setChromeStorage(linksSetting);
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

//使わないのか？！
function removeChromeStorage(keys) {
    return new Promise(resolve => {
        chrome.storage.local.remove(keys);
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