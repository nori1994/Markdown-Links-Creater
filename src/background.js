const LINKS_STORAGE_KEY = 'links';
const LASTID_STORAGE_KEY = 'lastId';
const CAN_STOCK_LINKS_KEY = 'canStockLinks';

// 拡張のインストール時やバージョンアップ時に発火するイベントハンドラの登録
chrome.runtime.onInstalled.addListener(createContextMenu);

// ブラウザ起動時に発火するイベントハンドラの登録
chrome.runtime.onStartup.addListener(createContextMenu);

// コンテキストメニュークリック時に発火するイベントハンドラの登録
chrome.contextMenus.onClicked.addListener(createLink);

// ブラウザアイコンクリック時にページリンクをMarkdown形式でコピーするイベントハンドラの登録
chrome.browserAction.onClicked.addListener(createLink);

function createContextMenu() {
    chrome.contextMenus.create({
        id: 'createLinkMenu',
        title: 'Create Markdown Links',
        contexts: ['all'],
        type: 'normal'
    });
}

function createLink(info, tab) {
    var script = document.createElement("script");
    script.src = "main.js";
    var head = document.getElementsByTagName("head");
    head[0].appendChild(script);

    let url;
    if (info.mediaType === 'image') {
        url = info.srcUrl;
    } else {
        url = info.linkUrl || info.pageUrl || info.url;
        if (!url) {
            if (tab)
                url = tab.url;
        }
    }

    let text = info.selectionText || info.title || url;

    if (url && text)
        saveLink('[' + text + '](' + url + ')');
    console.log('text: ' + text);
    console.log('url: ' + url);
}

async function getLinks() {
    let links = await getChromeStorage(LINKS_STORAGE_KEY);
    return links[LINKS_STORAGE_KEY];
}

function saveLink(text) {
    getChromeStorage().then(
        response => {
            let lastId = response[LASTID_STORAGE_KEY];
            if (Number(lastId)) {
                lastId++;
            } else {
                lastId = 1;
            }

            let canStockLinks = response[CAN_STOCK_LINKS_KEY];
            let links = response[LINKS_STORAGE_KEY];
            if (!links || !canStockLinks)
                links = new Array();

            links.push(text);

            return saveStorage(lastId, links);
        }
    )
        .then(
            response => {
                return getLinks();
            }
        )
        .then(
            response => {
                copyToClipBoard(response);
            }
        )
}

async function saveStorage(lastId, links) {
    let linksSetting = {};
    linksSetting[LINKS_STORAGE_KEY] = links;

    let lastIdSetting = {};
    lastIdSetting[LASTID_STORAGE_KEY] = lastId;

    await setChromeStorage(linksSetting);
    await setChromeStorage(lastIdSetting);
}

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