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
let COPY_BUTTON;
let CHECKED_CHECKBOX_IDS = [];

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
    COPY_BUTTON = document.getElementById('copy');

    CAN_STOCK_LINKS_BUTTON.addEventListener('click', canStockLinks);
    CANNOT_STOCK_LINKS_BUTTON.addEventListener('click', cannotStockLinks);
    ALL_SELECT_BUTTON.addEventListener('click', selectAllLinks);
    ALL_DESELECT_BUTTON.addEventListener('click', deselectAllLinks);
    DELETE_BUTTON.addEventListener('click', deleteLink);
    COPY_BUTTON.addEventListener('click', copyLinks);

    CHECKED_CHECKBOX_IDS = [];

    chrome.storage.onChanged.addListener
        ((changes) => {
            if (changes[CAN_STOCK_LINKS_KEY]) {
                changeActivationButtons(changes[CAN_STOCK_LINKS_KEY][NEWVALUE_KEY]);

                if (!changes[CAN_STOCK_LINKS_KEY][NEWVALUE_KEY])
                    setLastLinkOnly();
            } else if (changes[LINKS_STORAGE_KEY]) {
                setTable(false);

                // リンク0から変わった時は再度ボタンを設定する
                if (changes[LINKS_STORAGE_KEY][OLDVALUE_KEY].length === 0) {
                    getChromeStorage(CAN_STOCK_LINKS_KEY).then(
                        setting => {
                            changeStockedLinksButtons(setting[CAN_STOCK_LINKS_KEY], false);

                        }
                    )
                }

                // リンク0に変わった時はボタンを非活性にする
                if (changes[LINKS_STORAGE_KEY][NEWVALUE_KEY].length === 0) {
                    getChromeStorage(CAN_STOCK_LINKS_KEY).then(
                        setting => {
                            changeStockedLinksButtons(setting[CAN_STOCK_LINKS_KEY], true);

                        }
                    )
                }
            }
        });

    // 設定状態でリンク一覧の状態も変わるため先に設定する
    let setting = await getChromeStorage(CAN_STOCK_LINKS_KEY);
    await setSetting(setting[CAN_STOCK_LINKS_KEY], true);

    await setTitle();
    await setTable(true);
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
            links => {
                setLinks(links);
                resetLastID();

                // 再度チェックしてチェック状態を解除
                checkCheckedCheckboxsAgain();
            }
        )
}

function checkCheckedCheckboxsAgain() {
    if (CHECKED_CHECKBOX_IDS.length !== 0) {
        for (let i = 0; i < CHECKED_CHECKBOX_IDS.length; i++) {
            checkLink(CHECKED_CHECKBOX_IDS[i]);
        }
    }
}

async function setTitle() {
    let manifest = chrome.runtime.getManifest();
    document.getElementById("title").innerText = manifest.name;
    document.getElementById("name").innerText = manifest.name;
    document.getElementById("version").innerText = manifest.version;
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
    checkbox.setAttribute('id', index + 1);
    checkbox.setAttribute('click', deleteLink);
    selecttd.appendChild(checkbox);

    let linktd = newtr.insertCell(newtr.cells.length);
    linktd.innerHTML = text;

    newtr.addEventListener('click', selectLink);
}

async function setTable(isInitialize) {
    getChromeStorage().then(
        response => {
            let links = response[LINKS_STORAGE_KEY];
            // テーブルのクリア
            while (TABLE.rows[1]) TABLE.deleteRow(1);

            // テーブルの生成
            for (let i = 0; i < links.length; i++) {
                addTr(i, links[i]);
            }

            let setting = response[CAN_STOCK_LINKS_KEY];
            // OFFの時、チェックボックスのチェック状態を半輝度にする
            if (STOCK_LINKS_SETTING.OFF === setting) {
                changeActivationCheckbox(false);
            }

            // チェック状態の作り直し
            checkCheckedCheckboxsAgain();

            // リンクが0の場合、ボタンを非活性にする
            if (isInitialize && links.length == 0)
                changeStockedLinksButtons(setting, true);
        }
    );
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

async function setSetting(settingAfter, isInitialize) {
    getChromeStorage(STOCK_LINKS_SETTING).then(
        settingBefore => {
            settingBefore = settingBefore[CAN_STOCK_LINKS_KEY];
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
        setting => {
            if (isInitialize)
                changeActivationButtons(setting);
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

    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            changeStockedLinksButtons(isActivation, links[LINKS_STORAGE_KEY].length === 0);
        }
    )

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

function changeStockedLinksButtons(isActivation, isNoLink) {
    ALL_SELECT_BUTTON.disabled = (isActivation && !isNoLink) ? false : true;
    ALL_DESELECT_BUTTON.disabled = (isActivation && !isNoLink) ? false : true;
    DELETE_BUTTON.disabled = (isActivation && !isNoLink) ? false : true;
    COPY_BUTTON.disabled = isNoLink;
}

function canStockLinks(event) {
    setSetting(STOCK_LINKS_SETTING.ON, false);
}

function cannotStockLinks(event) {
    setSetting(STOCK_LINKS_SETTING.OFF, false);
}

function copyLinks(event) {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            copyToClipBoard(links[LINKS_STORAGE_KEY]);
        }
    )
}

function checkLink(index, type) {
    // チェックボックスからのクリックの場合は2重でチェックすることになるためチェックしない
    if (type !== 'checkbox') {
        let checkbox = document.getElementById(index);
        checkbox.checked = checkbox.checked ? false : true;

        setCheckedCheckboxIDs(checkbox.checked, index);
    }
}

function selectLink(event) {
    checkLink(event.currentTarget.rowIndex, event.target.type);
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
            checkLink(i, event.target.type);
    }
}

function deleteLink(event) {
    getChromeStorage(LINKS_STORAGE_KEY).then(
        links => {
            let newLinks = links[LINKS_STORAGE_KEY].filter(
                function (value, index) {
                    if (!document.getElementById(index + 1).checked) {
                        return value;
                    } else {
                        setCheckedCheckboxIDs(false, index + 1);
                    }
                });

            return newLinks;
        }
    ).then(
        newLinks => {
            setLinks(newLinks);
        }
    )
}

function setCheckedCheckboxIDs(isCheck, index) {
    if (isCheck) {
        if (CHECKED_CHECKBOX_IDS.indexOf(index) === -1)
            CHECKED_CHECKBOX_IDS.push(index);
    } else {
        CHECKED_CHECKBOX_IDS = CHECKED_CHECKBOX_IDS.filter(n => n !== index);
    }
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