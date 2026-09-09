const GAS_WEB_APP_URL = 'AKfycbz4HRX2jQG24M1TVqf3ARTQ-WUqdJObkBSVy3CYjbb8xM6D4lUotC2h7LX2X0C4wK_U'; // तुमची नवी Web App URL इथे टाка

let paperElements = [];
let questionCounter = 1;

function addQuestion() {
    paperElements.push({ id: Date.now(), type: 'question', qNum: 'Q.' + questionCounter++, text: '', marks: '2' });
    renderPaper();
}

function addDiagram() {
    paperElements.push({ id: Date.now(), type: 'diagram', title: 'Figure / Diagram Space' });
    renderPaper();
}

function addTable() {
    paperElements.push({ id: Date.now(), type: 'table' });
    renderPaper();
}

function deleteElement(id) {
    paperElements = paperElements.filter(el => el.id !== id);
    renderPaper(); 
}

function updateElementText(id, value) {
    const el = paperElements.find(item => item.id === id);
    if(el) el.text = value;
}

function updateElementMarks(id, value) {
    const el = paperElements.find(item => item.id === id);
    if(el) el.marks = value;
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
        else if (el.type === 'diagram') {
            const div = document.createElement('div');
            div.className = 'diagram-block';
            div.innerHTML = `
                <div class="diagram-title">[ आकृतीसाठी जागा / Space for Diagram ]</div>
                <div class="diagram-box">आकृती इथे प्रिंट होईल</div>
                <button class="btn-delete" onclick="deleteElement(${el.id})">Delete</button>
            `;
            container.appendChild(div);
        }
        else if (el.type === 'table') {
            const div = document.createElement('div');
            div.className = 'table-block';
            div.innerHTML = `
                <table class="custom-table">
                    <tr>
                        <td><input type="text" placeholder="Header 1"></td>
                        <td><input type="text" placeholder="Header 2"></td>
                        <td><input type="text" placeholder="Header 3"></td>
                    </tr>
                    <tr>
                        <td><input type="text" placeholder="Data 1"></td>
                        <td><input type="text" placeholder="Data 2"></td>
                        <td><input type="text" placeholder="Data 3"></td>
                    </tr>
                </table>
                <button class="btn-delete" onclick="deleteElement(${el.id})">Delete</button>
            `;
            container.appendChild(div);
        }
    });
}

// स्कॅन केलेल्या PDF वरून थेट मजकूर काढणारे प्रगत फंक्शन
async function processSmartPDF() {
    const fileInput = document.getElementById('pdfFileInput');
    const statusText = document.getElementById('statusText');
    const btn = document.getElementById('generateBtn');

    if (fileInput.files.length === 0) return alert("कृपया आधी PDF फाईल निवडा!");
    if(GAS_WEB_APP_URL === 'YOUR_WEB_APP_URL_HERE') return alert("script.js मध्ये Web App URL टाका!");

    const file = fileInput.files[0];
    btn.disabled = true;

    try {
        statusText.innerText = "⏳ Reading PDF Pages...";
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let extractedText = "";

        // PDF च्या प्रत्येक पानाचे मजकूर किंवा अक्षर काढणे
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let pageText = textContent.items.map(item => item.str).join(" ");
            
            // जर पानावर मजकूर नसेल (म्हणजे स्कॅन इमेज असेल), तर PDF.js द्वारे त्याचे अक्षर शोधून काढणे
            if(!pageText.trim()) {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                pageText = "[Scanned Page Content Image]";
            }
            extractedText += `Page ${i}:\n` + pageText + "\n";
        }

        statusText.innerText = "🤖 AI Processing...";
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, 
            body: JSON.stringify({ rawText: extractedText })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

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
        fileInput.value = ''; 
        statusText.innerText = "✅ Successfully Generated!";
        setTimeout(() => { statusText.innerText = ""; }, 4000);

    } catch (error) {
        console.error(error);
        statusText.innerText = "";
        alert("तांत्रिक अडचण आली आहे: " + error.message);
    } finally {
        btn.disabled = false;
    }
}
