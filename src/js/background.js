// 拡張のインストール時やバージョンアップ時に発火するイベントハンドラの登録
chrome.runtime.onInstalled.addListener(createContextMenu);

// ブラウザ起動時に発火するイベントハンドラの登録
chrome.runtime.onStartup.addListener(createContextMenu);

// コンテキストメニュークリック時に発火するイベントハンドラの登録
chrome.contextMenus.onClicked.addListener(onClickContextMenu);

// ブラウザアイコンクリック時にページリンクをMarkdown形式でコピーするイベントハンドラの登録
chrome.browserAction.onClicked.addListener(createLink);

function createContextMenu() {
    chrome.contextMenus.create({
        id: 'createLink',
        title: 'Create Markdown Link',
        contexts: ['all'],
        type: 'normal'
    });
    chrome.contextMenus.create({
        id: 'createAllLink',
        title: 'Create All Markdown Link',
        contexts: ['all'],
        type: 'normal'
    });
    chrome.contextMenus.create({
        id: 'separator',
        contexts: ['all'],
        type: 'separator'
    });
    chrome.contextMenus.create({
        id: 'resetStockedLinks',
        title: 'Reset Stocked Links',
        contexts: ['all'],
        type: 'normal'
    });
}

function onClickContextMenu(info, tab) {
    if (info.menuItemId === 'createLink') {
        createLink(info, tab);
    } else if (info.menuItemId === 'createAllLink') {
        createAllLink();
    } else if (info.menuItemId === 'resetStockedLinks') {
        resetStockedLinks();
    }
}

function createLink(info, tab) {
    let url;
    if (info.mediaType === 'image') {
        url = info.srcUrl;
    } else {
        url = info.linkUrl || info.pageUrl || info.url;
        if (!url && tab)
            url = tab.url;
    }

    let text = info.selectionText || info.title;

    if (!text && tab)
        text = tab.title;

    if (!text)
        text = url;

    if (url && text)
        saveLinks(['[' + text + '](' + url + ')']);

    console.log('text: ' + text);
    console.log('url: ' + url);
}

async function getLinks() {
    let links = await getChromeStorage(LINKS_STORAGE_KEY);
    return links[LINKS_STORAGE_KEY];
}

async function saveStorage(lastId, links, isUnsetCanStockLinks) {
    let linksSetting = {};
    linksSetting[LINKS_STORAGE_KEY] = links;

    let lastIdSetting = {};
    lastIdSetting[LASTID_STORAGE_KEY] = lastId;

    await setChromeStorage(linksSetting);
    await setChromeStorage(lastIdSetting);

    // CAN_STOCK_LINKS_KEYが未設定の場合、ONで設定する
    if (isUnsetCanStockLinks) {
        let canStockLinks = {};
        canStockLinks[CAN_STOCK_LINKS_KEY] = true;
        await setChromeStorage(canStockLinks);
    }
}

function createAllLink() {
    chrome.tabs.query({ 'lastFocusedWindow': true }, function (tabs) {
        var linkStrs = new Array();
        for (let tab of tabs) {
            let text = tab.title;
            if (!text)
                text = tab.url;

            console.log('text: ' + text);
            console.log('url: ' + tab.url);

            if (text && tab.url)
                linkStrs.push('[' + text + '](' + tab.url + ')');
        }

        saveLinks(linkStrs);
    });
}

function saveLinks(linkStrs) {
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

            for (let linkStr of linkStrs) {
                links.push(linkStr);
            }
            console.log("links: " + links.length);
            return saveStorage(lastId, links, (canStockLinks == null));
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

function resetStockedLinks() {
    setLinks(new Array());
}