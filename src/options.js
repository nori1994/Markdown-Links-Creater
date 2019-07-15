/*
const LINKS_STORAGE_KEY = 'links';
const LASTID_STORAGE_KEY = 'lastId';
const CAN_STOCK_LINKS_KEY = 'canStockLinks';
*/
const STOCK_LINKS_SETTING = {
    ON: true,
    OFF: false,
    NOSET: null
};
const NEWVALUE_KEY = 'newValue';
const OLDVALUE_KEY = 'oldValue';

window.onload = function () {
    // ページ読み込み時に実行したい処理
    initialize();
}

let TABLE;
let ALL_SELECT_BUTTON;
let ALL_DESELECT_BUTTON;
let DELETE_BUTTON;
let CAN_STOCK_LINKS_BUTTON;
let CANNOT_STOCK_LINKS_BUTTON;

async function initialize() {
    TABLE = document.getElementById("linksTable");
    CAN_STOCK_LINKS_BUTTON = document.getElementById('canStockLinks');
    CANNOT_STOCK_LINKS_BUTTON = document.getElementById('cannotStockLinks');
    ALL_SELECT_BUTTON = document.getElementById('allSelect');
    ALL_DESELECT_BUTTON = document.getElementById('allDeselect');
    DELETE_BUTTON = document.getElementById('delete');

    CAN_STOCK_LINKS_BUTTON.addEventListener('click', canStockLinks);
    CANNOT_STOCK_LINKS_BUTTON.addEventListener('click', cannotStockLinks);
    document.getElementById('copy').addEventListener('click', copyLinks);
    ALL_SELECT_BUTTON.addEventListener('click', selectAllLinks);
    ALL_DESELECT_BUTTON.addEventListener('click', deselectAllLinks);
    DELETE_BUTTON.addEventListener('click', deleteLink);

    chrome.storage.onChanged.addListener
        ((changes) => {
            if (changes[CAN_STOCK_LINKS_KEY]) {
                if (!changes[CAN_STOCK_LINKS_KEY][NEWVALUE_KEY])
                    setLastLinkOnly();
                //changeActivationStockedLinksButtons(changes[CAN_STOCK_LINKS_KEY][NEWVALUE_KEY]);
            } else if (changes[LINKS_STORAGE_KEY]) {
                setTable();
            }
            // TODO:テーブル追加・削除だけしたい
            //table.deleteRow(i);
        });


    //checkStockLinksSetting(result);
    await setTitle();
    await setTable();
    let setting = await getChromeStorage(CAN_STOCK_LINKS_KEY);
    await setSetting(setting[CAN_STOCK_LINKS_KEY]);
    //await setActivationStockedLinksButtons();
}

// いらない
async function setActivationStockedLinksButtons() {
    let setting = await getChromeStorage(CAN_STOCK_LINKS_KEY);
    await setSetting(setting[CAN_STOCK_LINKS_KEY]);
    changeActivationStockedLinksButtons(setting[CAN_STOCK_LINKS_KEY]);
}

function changeActivationStockedLinksButtons(isActivation) {
    let checkbox = document.getElementById(1);
    if (checkbox) {
        checkbox.disabled = !isActivation;

        if (isActivation) {
            TABLE.rows[1].addEventListener('click', selectLink);
        } else {
            TABLE.rows[1].removeEventListener('click', selectLink);
        }
    }

    ALL_SELECT_BUTTON.disabled = !isActivation;
    ALL_DESELECT_BUTTON.disabled = !isActivation;
    DELETE_BUTTON.disabled = !isActivation;
}

async function setTitle() {
    let manifest = chrome.runtime.getManifest();
    document.getElementById("title").innerText = manifest.name;
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("version").innerText = manifest.version;
}

async function setTable() {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            links = links[LINKS_STORAGE_KEY];
            // テーブルのクリア
            while (TABLE.rows[1]) TABLE.deleteRow(1);

            // テーブルの生成
            for (let i = 0; i < links.length; i++) {
                let newtr = TABLE.getElementsByTagName('tbody')[0].insertRow(i);
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

                newtr.addEventListener('click', selectLink);
            }
            // itemsは1からのオブジェクト
            // TODO:chrome.storageのArray登録すれば無駄にfor文回さなくて済む
        }
    );
}

async function setSetting(settingAfter) {
    getChromeStorage(CAN_STOCK_LINKS_KEY).then(
        settingBefore => {
            return settingBefore[CAN_STOCK_LINKS_KEY];
        }
    ).then(
        settingBefore => {
            if (Object.keys(settingBefore).length === 0 && settingAfter == STOCK_LINKS_SETTING.NOSET) {
                return setCanStockLinks(STOCK_LINKS_SETTING.OFF);
            } else if (settingBefore == STOCK_LINKS_SETTING.NOSET ||
                (settingAfter != STOCK_LINKS_SETTING.NOSET && settingBefore !== settingAfter)) {
                return setCanStockLinks(settingAfter);
            } else {
                return settingBefore;
            }
        }
    ).then(
        result => {
            checkStockLinksSetting(result);
            changeActivationStockedLinksButtons(result);
        }
    )
}

async function setCanStockLinks(setting) {
    let data = {};
    data[CAN_STOCK_LINKS_KEY] = setting;
    await setChromeStorage(data);
    return setting;
}

function checkStockLinksSetting(result) {
    if (result !== STOCK_LINKS_SETTING.ON && result !== STOCK_LINKS_SETTING.OFF
        && (!CAN_STOCK_LINKS_BUTTON.checked && !CANNOT_STOCK_LINKS_BUTTON.checked)) return;

    if (result === STOCK_LINKS_SETTING.ON && !CAN_STOCK_LINKS_BUTTON.checked) {
        CAN_STOCK_LINKS_BUTTON.checked = true;
        CANNOT_STOCK_LINKS_BUTTON.checked = false;
    } else if (result === STOCK_LINKS_SETTING.OFF && !CANNOT_STOCK_LINKS_BUTTON.checked) {
        CAN_STOCK_LINKS_BUTTON.checked = false;
        CANNOT_STOCK_LINKS_BUTTON.checked = true;
        /*
                getChromeStorage(LINKS_KEY).then(
                    links => {
                        links = links[LINKS_KEY];
                        let result = [];
                        result.push(links[links.length - 1]);
                        return result;
                    }
                )
                    .then(
                        response => {
                            setLinks(response);
                        }
                    )
                    */
    }
}

function setLastLinkOnly() {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            links = links[LINKS_STORAGE_KEY];
            if (links.length === 0)
                return links;

            let result = [];
            result.push(links[links.length - 1]);
            return result;
        }
    )
        .then(
            response => {
                setLinks(response);
                resetLastID();
            }
        )
}

function canStockLinks(event) {
    setSetting(STOCK_LINKS_SETTING.ON);
}

function cannotStockLinks(event) {
    /*
    getChromeStorage(LINKS_KEY).then(
        response => {
            let links = response[LINKS_KEY];
            let result = [];
            result.push(links[links.length - 1]);
            return result;
        }
    )
        .then(
            response => {
                setLinks(response);
            }
        )
 
    document.getElementById("canStockedLinks").checked = false;
    document.getElementById("cannotStockedLinks").checked = true;
    */
    // TODO:リンクの設定を上書き保存
    setSetting(STOCK_LINKS_SETTING.OFF);
    //checkStockLinksSetting(result);
}

function copyLinks(event) {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            copyToClipBoard(links[LINKS_STORAGE_KEY]);
        }
    )
}

// event引数がなくても動く
function checkLink(index, event) {
    let checkbox = document.getElementById(index);
    if (event.target.type !== 'checkbox')
        checkbox.checked = checkbox.checked ? false : true;
}

function selectLink(event) {
    // trから直接checkbox制御はできなかった、
    //let cell = event.currentTarget.cells[CHECKBOX_ROW_INDEX];
    //cell.checkbox.checked = true;
    // linksが定義されてないと怒られる
    //let checkbox = document.linksTable.links[event.currentTarget.rowIndex];
    checkLink(event.currentTarget.rowIndex, event);
}

function selectAllLinks(event) {
    alignCheckAllLinksState(true);
}

function deselectAllLinks(event) {
    alignCheckAllLinksState(false);
}

function alignCheckAllLinksState(isSelectAllLinks) {
    for (let i = 1; i < TABLE.rows.length; i++) {
        if (document.getElementById(i).checked !== isSelectAllLinks)
            checkLink(i, event);
    }
}

function deleteLink(event) {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            let newLinks = links[LINKS_STORAGE_KEY].filter(
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
    let data = {};
    data[LINKS_STORAGE_KEY] = links;
    await setChromeStorage(data);
}

async function resetLastID() {
    let data = {};
    data[LASTID_STORAGE_KEY] = 0;
    await setChromeStorage(data);
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
/*
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
*/