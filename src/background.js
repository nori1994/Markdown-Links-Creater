// 拡張のインストール時やバージョンアップ時に発火するイベントハンドラの登録
chrome.runtime.onInstalled.addListener(createContextMenu);

// ブラウザ起動時に発火するイベントハンドラの登録
chrome.runtime.onStartup.addListener(createContextMenu);

// コンテキストメニュークリック時に発火するイベントハンドラの登録
chrome.contextMenus.onClicked.addListener(createLink);

// ブラウザアイコンクリック時にページリンクをMarkdown形式でコピーするイベントハンドラの登録
chrome.browserAction.onClicked.addListener(createLink);

function createContextMenu() {
    console.log("createContextMenu");

    chrome.contextMenus.create({
        id: 'createLinkMenu',
        title: 'Create Markdown Links',
        contexts: ['all'],
        type: 'normal'
    });
}

function createLink(info, tab) {
    console.log("createLink");

    //var mediaType = info.mediaType;
    //var srcUrl = info.srcUrl;
    //var url = info.pageUrl;
    //var isSelectedText = typeof selectionText !== 'undefined';

    var text = info.selectionText || info.title || tab !== undefined ? tab.url : info.url;

    var url;
    if (info.mediaType === 'image') {
        url = info.srcUrl;
    } else {
        url = info.linkUrl || info.pageUrl || tab !== undefined ? tab.url : info.url;
    }

    // TODO:リンクが上手く拾えないときの例外処理
    saveLink('[' + text + '](' + url + ')');

    //var retult = copyToClipBoard();

    // TODO:ショートカット
    // TODO：権限の整理
}

function copyToClipBoard(items) {
    var text = '';
    /*
                for (var i = 1; i < Object.keys(items).length + 1; i++) {
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
    var ta = document.createElement('textarea');
    var st = ta.style;
    st.position = 'fixed';
    st.left = '-100%';
    ta.value = text;

    // 作成したテキストエリアをbody要素に追加
    document.body.appendChild(ta);

    // テキストエリアを選択
    ta.select();

    // クリップボードにコピー
    var result = document.execCommand('copy');

    // body要素から作成したテキストエリアを削除
    document.body.removeChild(ta);

    return result;
}

async function getLinks(range) {
    if (range === 'all') {
        return await getChromeStorage(null);
    } else {
        return null;
    }
}

function getLinkLength() {
    return new Promise(resolve => {
        chrome.storage.local.get('length', resolve);
    });
}

// tukaen
const ChromeStorage = {
    get: async function (keys) {
        return new Promise(resolve => {
            chrome.storage.local.get(keys, resolve);
        });
    },

    set: async function (items) {
        return new Promise(resolve => {
            chrome.storage.local.set(items, resolve);
        });
    }
};

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

//https://teratail.com/questions/138504
function saveLink(text) {
    getChromeStorage('length').then(
        response => {
            var length = response['length'];
            if (Number(length)) {
                length++;
            } else {
                length = 1;
            }

            return save(length, text);
        }
    )
        .then(
            response => {
                return getLinks('all');
            }
        )
        .then(
            response => {
                var result = copyToClipBoard(response);
                console.log('save link success:' + result);
            }
        )
    //var a = ChromeStorage.get('length');
    //await ChromeStorage.set({ 'length': 23 }, function () { });
}

async function save(length, text) {
    var tmp = {};
    tmp[length] = text;
    await setChromeStorage(tmp);
    await setChromeStorage({ 'length': length });
}
