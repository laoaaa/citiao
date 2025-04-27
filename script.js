// 修复词条无法匹配问题，移除词边界断言，保留词长优先逻辑

let forbiddenWords = [];
let wordSources = {};
let isForbiddenWordsLoaded = false;

async function loadForbiddenWords() {
    try {
        const response = await fetch('词表.json');
        if (!response.ok) throw new Error(`HTTP错误！状态：${response.status}`);

        const data = await response.json();
        if (Array.isArray(data)) {
            data.forEach(item => {
                const word = item.word;
                forbiddenWords.push(word);
                if (!wordSources[word]) {
                    wordSources[word] = [];
                }
                wordSources[word].push(item.source);
            });
        }

        forbiddenWords.sort((a, b) => b.length - a.length);

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
    let matchedRanges = []; // 用于避免重复覆盖

    forbiddenWords.forEach(word => {
        const regex = new RegExp(escapeRegExp(word), 'g');
        let match;

        while ((match = regex.exec(textInput)) !== null) {
            const start = match.index;
            const end = start + word.length;

            // 检查是否与已匹配区域重叠，若无则添加
            if (!matchedRanges.some(r => (start < r[1] && end > r[0]))) {
                matchedRanges.push([start, end]);
                detectedWords.add(word);
            }
        }
    });

    // 排序防止嵌套错位（从后往前替换）
    matchedRanges.sort((a, b) => b[0] - a[0]);
    matchedRanges.forEach(([start, end]) => {
        const original = escapeHtml(textInput.slice(start, end));
        resultHTML =
            resultHTML.slice(0, start) +
            `<span class="highlight">${original}</span>` +
            resultHTML.slice(end);
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
            const sources = wordSources[word] || ['（无出处信息）'];
            const sourceText = sources.map(src => `<div class="note">出处：${src}</div>`).join('');
            listItem.innerHTML = `<strong>${word}</strong>${sourceText}`;
            wordList.appendChild(listItem);
        });
        detectedWordsDiv.style.display = 'block';
        const defaultNote = detectedWordsDiv.querySelector('.note');
        if (defaultNote && defaultNote.textContent.includes('提示')) defaultNote.remove();
    } else {
        detectedWordsDiv.style.display = 'block';
        const defaultNote = detectedWordsDiv.querySelector('.note');
        if (defaultNote) defaultNote.textContent = '未检测到词语。';
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