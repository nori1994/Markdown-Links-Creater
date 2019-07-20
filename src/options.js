const STOCK_LINKS_SETTING = {
    ON: true,
    OFF: false,
    NOSET: null
};
const NEWVALUE_KEY = 'newValue';
const OLDVALUE_KEY = 'oldValue';

let TABLE;
let CAN_STOCK_LINKS_BUTTON;
let CANNOT_STOCK_LINKS_BUTTON;
let ALL_SELECT_BUTTON;
let ALL_DESELECT_BUTTON;
let DELETE_BUTTON;
let CHECKBOX_IDS = [];

window.onload = function () {
    // ページ読み込み時に実行したい処理
    initialize();
}

async function initialize() {
    TABLE = document.getElementById("linksTable");
    CAN_STOCK_LINKS_BUTTON = document.getElementById('canStockLinks');
    CANNOT_STOCK_LINKS_BUTTON = document.getElementById('cannotStockLinks');
    ALL_SELECT_BUTTON = document.getElementById('allSelect');
    ALL_DESELECT_BUTTON = document.getElementById('allDeselect');
    DELETE_BUTTON = document.getElementById('delete');

    CAN_STOCK_LINKS_BUTTON.addEventListener('click', canStockLinks);
    CANNOT_STOCK_LINKS_BUTTON.addEventListener('click', cannotStockLinks);
    ALL_SELECT_BUTTON.addEventListener('click', selectAllLinks);
    ALL_DESELECT_BUTTON.addEventListener('click', deselectAllLinks);
    DELETE_BUTTON.addEventListener('click', deleteLink);
    document.getElementById('copy').addEventListener('click', copyLinks);

    chrome.storage.onChanged.addListener
        ((changes) => {
            if (changes[CAN_STOCK_LINKS_KEY]) {
                if (!changes[CAN_STOCK_LINKS_KEY][NEWVALUE_KEY])
                    setLastLinkOnly();
            } else if (changes[LINKS_STORAGE_KEY]) {
                setTable(false);
                //changeTable(changes[LINKS_STORAGE_KEY][NEWVALUE_KEY], changes[LINKS_STORAGE_KEY][OLDVALUE_KEY]);
            }
        });

    await setTitle();
    await setTable(true);

    let setting = await getChromeStorage(CAN_STOCK_LINKS_KEY);
    await setSetting(setting[CAN_STOCK_LINKS_KEY]);
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

async function setTitle() {
    let manifest = chrome.runtime.getManifest();
    document.getElementById("title").innerText = manifest.name;
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("version").innerText = manifest.version;
}

async function changeTable(newValues, oldValues) {
    if (newValues.length > oldValues.length) {
        /*
        var urls = newValues.filter(function (value, index, array) {
            if (oldValues.indexOf(value) == -1)
                return index;
        });
*/
        // 新しくリンクを追加
        let items = [];
        for (let i = oldValues.length - 1; i < newValues.length - oldValues.length; i++) {
            items.push([i, newValues[i]]);
        }
        /* 同じURLだとindexが追加されない
        let indexs = [];
        for (let i = 0; i < newValues.length; i++) {
            if (oldValues.indexOf(newValues[i]) == -1)
                indexs.push([i, newValues[i]]);
        }
*/
        if (indexs.length !== 0) {
            for (let i = 0; i < indexs.length; i++) {
                let [index, url] = indexs[i];
                addTr(index, url);
            }
        }
    } else if (newValues.length < oldValues.length) {
        let deleteIndex = [];
        for (let i = 0; i < oldValues.length; i++) {
            if (newValues.indexOf(oldValues[i]) == -1)
                deleteIndex.push(i);
        }

        // 後ろから削除
        if (deleteIndex.length !== 0) {
            for (let i = deleteIndex.length - 1; i >= 0; i--) {
                TABLE.getElementsByTagName('tbody')[0].deleteRow(deleteIndex[i]);
            }
        }
    } else {
        //TODO:削除する

        let indexs = [];
        for (let i = 0; i < newValues.length; i++) {
            if (oldValues.indexOf(newValues[i]) == -1)
                indexs.push([i, newValues[i]]);
        }

        if (indexs.length !== 0 && urls.length === indexs.length) {
            for (let i = 0; i < indexs.length; i++) {
                addTr(indexs[i], urls[i]);
            }
        }
    }
}

/**
 * 行の追加
 * @param {追加する行。0開始} index 
 * @param {行で表示するテキスト} text 
 */
function addTr(index, text) {
    let newtr = TABLE.getElementsByTagName('tbody')[0].insertRow(index);
    let selecttd = newtr.insertCell(newtr.cells.length);

    // チェックボックスの作成
    let checkbox = document.createElement('input');
    checkbox.setAttribute("type", "checkbox");
    //CHECKBOX_IDS.push(i + 1);
    checkbox.setAttribute('id', index + 1);
    checkbox.setAttribute('click', deleteLink);
    selecttd.appendChild(checkbox);

    let linktd = newtr.insertCell(newtr.cells.length);
    linktd.innerHTML = text;

    newtr.addEventListener('click', selectLink);
}

async function setTable(isInitialize) {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            links = links[LINKS_STORAGE_KEY];
            // テーブルのクリア
            while (TABLE.rows[1]) TABLE.deleteRow(1);

            // テーブルの生成
            for (let i = 0; i < links.length; i++) {
                addTr(i, links[i]);
            }
        }
    );

    // TODO:チェック状態の作り直し
    // OFFの時、チェックボックスのチェック状態を半輝度にする
    getChromeStorage(CAN_STOCK_LINKS_KEY).then(
        setting => {
            if (STOCK_LINKS_SETTING.OFF === setting[CAN_STOCK_LINKS_KEY]) {
                changeActivationCheckbox(false);
            }
        }
    )
}

function changeActivationCheckbox(isActivation) {
    let checkbox = document.getElementById(1);
    if (checkbox) {
        checkbox.disabled = !isActivation;

        if (isActivation) {
            TABLE.rows[1].addEventListener('click', selectLink);
        } else {
            TABLE.rows[1].removeEventListener('click', selectLink);
        }
    }
}

async function setSetting(settingAfter) {
    getChromeStorage(CAN_STOCK_LINKS_KEY).then(
        settingBefore => {
            return settingBefore[CAN_STOCK_LINKS_KEY];
        }
    ).then(
        settingBefore => {
            /*
            | settingBefore/settingAfter | null or undefined | FALSE | TRUE |
            |----------------------------|-------------------|-------|------|
            | null or undefined          | FALSE             | FALSE | TRUE |
            | FALSE                      | 不変              | 不変  | TRUE |
            | TRUE                       | 不変              | FALSE | 不変 |
            */
            if (settingBefore == STOCK_LINKS_SETTING.NOSET && settingAfter == STOCK_LINKS_SETTING.NOSET) {
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
            changeActivationButtons(result);
        }
    )
}

async function setCanStockLinks(setting) {
    let data = {};
    data[CAN_STOCK_LINKS_KEY] = setting;
    await setChromeStorage(data);
    return setting;
}

function changeActivationButtons(isActivation) {
    changeActivationCheckbox(isActivation);

    ALL_SELECT_BUTTON.disabled = !isActivation;
    ALL_DESELECT_BUTTON.disabled = !isActivation;
    DELETE_BUTTON.disabled = !isActivation;

    changeActivationSettingButtons(isActivation);
}

function changeActivationSettingButtons(result) {
    if (result !== STOCK_LINKS_SETTING.ON && result !== STOCK_LINKS_SETTING.OFF
        && (!CAN_STOCK_LINKS_BUTTON.checked && !CANNOT_STOCK_LINKS_BUTTON.checked))
        return;

    if (result === STOCK_LINKS_SETTING.ON && !CAN_STOCK_LINKS_BUTTON.checked) {
        CAN_STOCK_LINKS_BUTTON.checked = true;
        CANNOT_STOCK_LINKS_BUTTON.checked = false;
    } else if (result === STOCK_LINKS_SETTING.OFF && !CANNOT_STOCK_LINKS_BUTTON.checked) {
        CAN_STOCK_LINKS_BUTTON.checked = false;
        CANNOT_STOCK_LINKS_BUTTON.checked = true;
    }
}

function canStockLinks(event) {
    setSetting(STOCK_LINKS_SETTING.ON);
}

function cannotStockLinks(event) {
    setSetting(STOCK_LINKS_SETTING.OFF);
}

function copyLinks(event) {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            copyToClipBoard(links[LINKS_STORAGE_KEY]);
        }
    )
}

function checkLink(index, event) {
    let checkbox = document.getElementById(index);
    if (event.target.type !== 'checkbox')
        checkbox.checked = checkbox.checked ? false : true;
}

function selectLink(event) {
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