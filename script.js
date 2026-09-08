// 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴
// इथे तुमची Google Apps Script ची Web App URL टाका
const GAS_WEB_APP_URL = 'AKfycbzDdh1PGX3mDTR72XJ7f_zgugECJRyTls4ac81p2b4NEjj1gskwTk5KCYLV9pi0O-A';
// 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴

let paperElements = [];
let questionCounter = 1;

function addQuestion() {
    const newElement = { id: Date.now(), type: 'question', qNum: 'Q.' + questionCounter++, text: '', marks: '2' };
    paperElements.push(newElement);
    renderPaper();
}

function deleteElement(id) {
    paperElements = paperElements.filter(el => el.id !== id);
    renderPaper(); 
}

function updateElementText(id, value) {
    const element = paperElements.find(el => el.id === id);
    if(element) element.text = value;
}

function updateElementMarks(id, value) {
    const element = paperElements.find(el => el.id === id);
    if(element) element.marks = value;
}

function renderPaper() {
    const container = document.getElementById('elements-container');
    container.innerHTML = ''; 
    paperElements.forEach(el => {
        if (el.type === 'question') {
            const div = document.createElement('div');
            div.className = 'question-block';
            div.innerHTML = `
                <div class="q-number">${el.qNum}</div>
                <div class="q-input-area">
                    <textarea class="q-text" oninput="updateElementText(${el.id}, this.value)">${el.text}</textarea>
                </div>
                <div class="q-marks-container">
                    [<input type="text" class="q-marks-input" value="${el.marks}" oninput="updateElementMarks(${el.id}, this.value)">]
                </div>
                <button class="btn-delete" onclick="deleteElement(${el.id})">Delete</button>
            `;
            container.appendChild(div);
        }
    });
}

// खऱ्या AI कडून (Google Apps Script मधून) डेटा मागवणारे फंक्शन
async function processAIGeneration() {
    const rawText = document.getElementById('rawTextInput').value;
    if(!rawText.trim()) return alert("कृपया मजकूर टाका!");
    if(GAS_WEB_APP_URL === 'YOUR_WEB_APP_URL_HERE') return alert("कृपया script.js मध्ये Web App URL टाका!");

    const btn = document.getElementById('generateBtn');
    btn.innerHTML = "⏳ Generating...";
    btn.disabled = true;

    try {
        // CORS एरर टाळण्यासाठी आपण 'text/plain' वापरत आहोत
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, 
            body: JSON.stringify({ rawText: rawText })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        const newQuestions = JSON.parse(result.data);

        newQuestions.forEach(q => {
            q.id = Date.now() + Math.random(); 
            paperElements.push(q);
            let numMatch = q.qNum.match(/\d+/);
            if(numMatch) {
                let num = parseInt(numMatch[0]);
                if(num >= questionCounter) questionCounter = num + 1;
            }
        });

        renderPaper();
        document.getElementById('rawTextInput').value = ''; 
        
    } catch (error) {
        console.error("Error details:", error);
        alert("तांत्रिक अडचण आली आहे:\n\n" + error.message);
    } finally {
        btn.innerHTML = "✨ Generate with AI";
        btn.disabled = false;
    }
}
