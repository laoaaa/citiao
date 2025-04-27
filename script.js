// 修改版 script.js，支持检索词条并显示其出处

let forbiddenWords = [];
let wordSources = {};
let isForbiddenWordsLoaded = false;

// 加载词表并构建词条及其出处
async function loadForbiddenWords() {
    try {
        const response = await fetch('词表.json');
        if (!response.ok) throw new Error(`HTTP错误！状态：${response.status}`);

        const data = await response.json();
        if (Array.isArray(data.words)) {
            // 简单词表（仅词条）
            forbiddenWords = data.words;
        } else if (Array.isArray(data) && typeof data[0] === 'object') {
            // 包含出处信息的结构
            forbiddenWords = data.map(item => item.word);
            data.forEach(item => wordSources[item.word] = item.source);
        }

        isForbiddenWordsLoaded = true;
        document.getElementById('loadStatus').textContent = '词表加载成功';
    } catch (error) {
        console.error('加载词表失败:', error);
        alert('加载词表失败，请稍后再试。');
        document.getElementById('loadStatus').textContent = '词表加载失败。';
    }
}

function checkForbiddenWords() {
    if (!isForbiddenWordsLoaded) {
        alert('词表尚未加载，请稍后再试。');
        return;
    }

    const textInput = document.getElementById('textInput').value;
    let resultHTML = escapeHtml(textInput);
    let detectedWords = new Set();

    forbiddenWords.forEach(word => {
        const regex = new RegExp(`${escapeRegExp(word)}`, 'gi');
        if (regex.test(textInput)) {
            detectedWords.add(word);
            resultHTML = resultHTML.replace(regex, `<span class="highlight">${word}</span>`);
        }
    });

    document.getElementById('result').innerHTML = resultHTML;
    displayDetectedWords(detectedWords);
}

function displayDetectedWords(detectedWords) {
    const detectedWordsDiv = document.getElementById('detectedWords');
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';

    if (detectedWords.size > 0) {
        detectedWords.forEach(word => {
            const listItem = document.createElement('li');
            const source = wordSources[word] || '（无出处信息）';
            listItem.innerHTML = `<strong>${word}</strong> —— ${source}`;
            wordList.appendChild(listItem);
        });
        detectedWordsDiv.style.display = 'block';
        detectedWordsDiv.querySelector('.note').textContent = '提示：请避免使用以上检测到的词语，已列出处。';
    } else {
        detectedWordsDiv.style.display = 'block';
        detectedWordsDiv.querySelector('.note').textContent = '未检测到词语。';
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

document.addEventListener('DOMContentLoaded', () => {
    loadForbiddenWords();
    document.getElementById('checkButton').addEventListener('click', checkForbiddenWords);
});
