const GAS_WEB_APP_URL = 'AKfycbz4HRX2jQG24M1TVqf3ARTQ-WUqdJObkBSVy3CYjbb8xM6D4lUotC2h7LX2X0C4wK_U'; // तुमची गुगल वेब ॲप URL इथे ठेवा

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

// 📂 PDF वाचून ती AI कडे पाठवणारे मुख्य फंक्शन
async function processPDFAndAI() {
    const fileInput = document.getElementById('pdfFileInput');
    if (fileInput.files.length === 0) {
        return alert("कृपया आधी कोणतीही एक PDF फाईल निवडा!");
    }

    if(GAS_WEB_APP_URL === 'YOUR_WEB_APP_URL_HERE') {
        return alert("कृपया script.js मध्ये तुमची Google Web App URL टाका!");
    }

    const file = fileInput.files[0];
    const btn = document.getElementById('generateBtn');
    btn.innerHTML = "⏳ Reading PDF...";
    btn.disabled = true;

    try {
        // 1. PDF फाईल वाचणे (pdf.js च्या मदतीने)
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(" ");
            extractedText += pageText + "\n";
        }

        if (!extractedText.trim()) {
            throw new Error("PDF मधून मजकूर वाचता आला नाही. कदाचित PDF मध्ये स्कॅन केलेली इमेज असेल.");
        }

        btn.innerHTML = "🤖 AI Generating...";

        // 2. वाचलेला मजकूर आपल्या Google Apps Script बॅकएंडकडे पाठवणे
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
        fileInput.value = ''; // file input clear करणे
        alert("PDF मधील प्रश्न यशस्वीरित्या तयार झाले आहेत!");

    } catch (error) {
        console.error("Error details:", error);
        alert("तांत्रिक अडचण आली आहे:\n\n" + error.message);
    } finally {
        btn.innerHTML = "✨ Extract & Generate";
        btn.disabled = false;
    }
}
