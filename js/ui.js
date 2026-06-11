// ============================================================
// AXIOM AGENT-SKILLS REGISTRY - UI CONTROLLER v1.0
// ============================================================

const skillsDB = [
    { id: "x_grabber", name: "X-Stream Grabber", category: "web", desc: "Extrae tweets, perfiles y tendencias de X", params: { username: "", limit: 10 }, defaultOn: false, icon: "fa-brands fa-twitter" },
    { id: "wifi_scanner", name: "Local WiFi Scanner", category: "security", desc: "Escanea redes WiFi locales y dispositivos", params: { interface: "wlan0", timeout: 5 }, defaultOn: false, icon: "fa-solid fa-wifi" },
    { id: "markdown_injector", name: "Markdown Injector", category: "documents", desc: "Inyecta conocimiento en formato Markdown", params: { filePath: "", mode: "append" }, defaultOn: false, icon: "fa-solid fa-file-alt" },
    { id: "web_scraper", name: "Web Scraper", category: "web", desc: "Extrae contenido de cualquier URL", params: { url: "", selector: "body" }, defaultOn: false, icon: "fa-solid fa-globe" },
    { id: "pdf_extractor", name: "PDF Extractor", category: "documents", desc: "Extrae texto de archivos PDF", params: { pdfPath: "", pages: "all" }, defaultOn: false, icon: "fa-solid fa-file-pdf" },
    { id: "github_analyzer", name: "GitHub Repo Analyzer", category: "data", desc: "Analiza repositorios de GitHub", params: { repo: "", includeIssues: true }, defaultOn: false, icon: "fa-brands fa-github" },
    { id: "sentiment_analyzer", name: "Sentiment Analyzer", category: "ia", desc: "Analiza sentimiento de texto", params: { language: "es", threshold: 0.5 }, defaultOn: false, icon: "fa-solid fa-face-smile" },
    { id: "text_summarizer", name: "Text Summarizer", category: "ia", desc: "Resumen automático de texto", params: { maxLength: 200, style: "concise" }, defaultOn: false, icon: "fa-solid fa-compress" },
    { id: "code_interpreter", name: "Code Interpreter", category: "utils", desc: "Ejecuta código Python/JS en sandbox", params: { language: "python", code: "" }, defaultOn: false, icon: "fa-solid fa-code" },
    { id: "email_sender", name: "Email Sender", category: "utils", desc: "Envía correos electrónicos", params: { smtp: "", to: "", subject: "" }, defaultOn: false, icon: "fa-solid fa-envelope" },
    { id: "slack_notifier", name: "Slack Notifier", category: "utils", desc: "Envía mensajes a Slack", params: { webhookUrl: "", channel: "#general" }, defaultOn: false, icon: "fa-brands fa-slack" },
    { id: "db_query", name: "Database Query", category: "data", desc: "Consulta SQL a bases de datos", params: { connection: "", query: "" }, defaultOn: false, icon: "fa-solid fa-database" },
    { id: "file_reader", name: "File System Reader", category: "security", desc: "Lee archivos locales", params: { path: "", encoding: "utf8" }, defaultOn: false, icon: "fa-solid fa-folder-open" },
    { id: "rag_vector", name: "RAG Vector Store", category: "ia", desc: "Busca en documentos indexados", params: { indexName: "", topK: 5 }, defaultOn: false, icon: "fa-solid fa-brain" },
    { id: "image_generator", name: "Image Generator", category: "ia", desc: "Genera imágenes (API integrada)", params: { prompt: "", size: "512x512" }, defaultOn: false, icon: "fa-solid fa-image" }
];

let skills = JSON.parse(JSON.stringify(skillsDB));
let currentFormat = "openai";
let currentView = "grid";
let currentSearch = "";
let currentCategory = "all";
let templates = JSON.parse(localStorage.getItem("axiom_skill_templates") || "{}");

function updateActiveCount() {
    let active = skills.filter(s => s.active === true);
    document.getElementById("activeCount").innerText = active.length;
    let tokenEstimate = active.length * 50 + active.reduce((sum, s) => sum + Object.keys(s.params).length * 10, 0);
    document.getElementById("tokenEstimate").innerText = tokenEstimate;
    generateJSON();
}

function generateJSON() {
    let active = skills.filter(s => s.active);
    let tools = [];
    for (let skill of active) {
        let parameters = {};
        for (let [key, val] of Object.entries(skill.params)) {
            parameters[key] = { type: "string", description: `${key} parameter` };
        }
        tools.push({
            type: "function",
            function: { name: skill.id, description: skill.desc, parameters: { type: "object", properties: parameters, required: [] } }
        });
    }
    let output = {};
    if (currentFormat === "openai") output = { tools: tools };
    else if (currentFormat === "claude") output = { tools: tools.map(t => ({ name: t.function.name, description: t.function.description, input_schema: t.function.parameters })) };
    else output = { skills: active.map(s => ({ id: s.id, name: s.name, params: s.params })) };
    document.getElementById("jsonOutput").innerHTML = JSON.stringify(output, null, 2);
}

function renderSkills() {
    let filtered = skills.filter(s => {
        let matchSearch = s.name.toLowerCase().includes(currentSearch.toLowerCase()) || s.desc.toLowerCase().includes(currentSearch.toLowerCase());
        let matchCategory = currentCategory === "all" || s.category === currentCategory;
        return matchSearch && matchCategory;
    });
    const container = document.getElementById("skillsContainer");
    container.className = currentView === "grid" ? "skills-grid" : "skills-list";
    container.innerHTML = filtered.map(skill => `
        <div class="skill-card ${skill.active ? 'skill-on' : 'skill-off'}" data-id="${skill.id}">
            <div class="skill-header">
                <div class="skill-name"><i class="${skill.icon}"></i> ${skill.name}<span class="skill-category">${skill.category}</span></div>
                <label class="switch"><input type="checkbox" class="skill-toggle" data-id="${skill.id}" ${skill.active ? 'checked' : ''}><span class="slider"></span></label>
            </div>
            <div class="skill-desc">${skill.desc}</div>
            <button class="toggle-params-btn" data-id="${skill.id}" style="font-size:9px;padding:4px 8px;">⚙️ Parámetros</button>
            <div class="skill-params" id="params-${skill.id}">
                ${Object.entries(skill.params).map(([key, val]) => `<div class="param-row"><label>${key}</label><input type="text" class="param-input" data-id="${skill.id}" data-param="${key}" value="${val}"></div>`).join('')}
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.skill-toggle').forEach(btn => btn.addEventListener('change', (e) => { let s = skills.find(s => s.id === e.target.dataset.id); if(s) s.active = e.target.checked; renderSkills(); }));
    document.querySelectorAll('.toggle-params-btn').forEach(btn => btn.addEventListener('click', (e) => document.getElementById(`params-${e.target.dataset.id}`).classList.toggle('show')));
    document.querySelectorAll('.param-input').forEach(inp => inp.addEventListener('change', (e) => { let s = skills.find(s => s.id === e.target.dataset.id); if(s) s.params[e.target.dataset.param] = e.target.value; generateJSON(); }));
    updateActiveCount();
}

function applyPack(pack) {
    skills.forEach(s => s.active = false);
    if (pack === "developer") skills.forEach(s => { if (s.id === "code_interpreter" || s.id === "github_analyzer" || s.id === "web_scraper") s.active = true; });
    if (pack === "data") skills.forEach(s => { if (s.id === "db_query" || s.id === "rag_vector" || s.id === "sentiment_analyzer") s.active = true; });
    if (pack === "social") skills.forEach(s => { if (s.id === "x_grabber" || s.id === "image_generator" || s.id === "slack_notifier") s.active = true; });
    renderSkills();
}

function saveTemplate() { let name = prompt("Nombre del template:"); if(name) { templates[name] = skills.map(s => ({ id: s.id, active: s.active, params: s.params })); localStorage.setItem("axiom_skill_templates", JSON.stringify(templates)); loadTemplatesToSelect(); } }
function loadTemplate(name) { if(templates[name]) { let t = templates[name]; skills.forEach(s => { let found = t.find(t => t.id === s.id); if(found) { s.active = found.active; s.params = found.params; } }); renderSkills(); } }
function loadTemplatesToSelect() { let sel = document.getElementById("loadTemplateSelect"); sel.innerHTML = '<option value="">📁 Cargar template guardado</option>' + Object.keys(templates).map(t => `<option value="${t}">${t}</option>`).join(''); sel.onchange = (e) => { if(e.target.value) loadTemplate(e.target.value); }; }
function deleteTemplate() { let name = document.getElementById("loadTemplateSelect").value; if(name && confirm(`¿Borrar template "${name}"?`)) { delete templates[name]; localStorage.setItem("axiom_skill_templates", JSON.stringify(templates)); loadTemplatesToSelect(); } }
function shareConfig() { let config = skills.map(s => ({ id: s.id, active: s.active, params: s.params })); let url = new URL(window.location.href); url.searchParams.set("config", btoa(JSON.stringify(config))); navigator.clipboard.writeText(url.href); alert("Enlace copiado"); }
function loadFromURL() { let params = new URLSearchParams(window.location.search); let configB64 = params.get("config"); if(configB64) { try { let config = JSON.parse(atob(configB64)); skills.forEach(s => { let c = config.find(c => c.id === s.id); if(c) { s.active = c.active; s.params = c.params; } }); renderSkills(); } catch(e){} } }
async function recommendSkills() { let text = prompt("Describe lo que quieres hacer con tu agente de IA:"); if(!text) return; document.getElementById("recommendationBox").classList.remove("hidden"); document.getElementById("recommendationText").innerHTML = "Analizando..."; setTimeout(() => { let lower = text.toLowerCase(); let recIds = []; if(lower.includes("twitter")||lower.includes("x")) recIds.push("x_grabber"); if(lower.includes("sentimiento")) recIds.push("sentiment_analyzer"); if(lower.includes("github")) recIds.push("github_analyzer"); if(lower.includes("web")) recIds.push("web_scraper"); if(recIds.length===0) recIds.push("code_interpreter"); let recText = "Recomendaciones: "; for(let id of recIds) { let s = skills.find(s => s.id === id); if(s) { s.active = true; recText += `✅ ${s.name} `; } } renderSkills(); document.getElementById("recommendationText").innerHTML = recText + "<br>🔧 Skills activadas."; }, 500); }

document.getElementById("searchInput").addEventListener("input", (e) => { currentSearch = e.target.value; renderSkills(); });
document.getElementById("categoryFilter").addEventListener("change", (e) => { currentCategory = e.target.value; renderSkills(); });
document.getElementById("packSelector").addEventListener("change", (e) => { if(e.target.value) applyPack(e.target.value); e.target.value = ""; });
document.getElementById("copyJsonBtn").onclick = () => { navigator.clipboard.writeText(document.getElementById("jsonOutput").innerText); alert("JSON copiado"); };
document.getElementById("exportJsonBtn").onclick = () => { let blob = new Blob([document.getElementById("jsonOutput").innerText], {type:"application/json"}); let a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `skills-config-${Date.now()}.json`; a.click(); };
document.getElementById("importJsonBtn").onclick = () => { let input = document.createElement("input"); input.type = "file"; input.accept = ".json"; input.onchange = (e) => { let file = e.target.files[0]; let reader = new FileReader(); reader.onload = (ev) => { try { JSON.parse(ev.target.result); alert("JSON importado (simulado)"); } catch(e) { alert("Error"); } }; reader.readAsText(file); }; input.click(); };
document.getElementById("shareConfigBtn").onclick = shareConfig;
document.getElementById("saveTemplateBtn").onclick = saveTemplate;
document.getElementById("deleteTemplateBtn").onclick = deleteTemplate;
document.getElementById("kioskBtn").onclick = () => document.documentElement.requestFullscreen();
document.getElementById("tourBtn").onclick = () => alert("🔍 Tutorial: 1. Activa skills con switches. 2. Configura parámetros. 3. Copia JSON para OpenAI/Claude.");
document.querySelectorAll(".format-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".format-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); currentFormat = btn.dataset.format; document.getElementById("currentFormat").innerText = currentFormat === "openai" ? "OpenAI" : (currentFormat === "claude" ? "Claude" : "Local"); generateJSON(); }));
document.querySelectorAll(".view-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); currentView = btn.dataset.view; renderSkills(); }));
const themeToggle = document.getElementById("themeToggle"); const htmlTag = document.documentElement;
themeToggle.addEventListener("click", () => { const isDark = htmlTag.getAttribute("data-theme") === "dark"; htmlTag.setAttribute("data-theme", isDark ? "light" : "dark"); themeToggle.innerText = isDark ? "☀️" : "🌙"; });
setTimeout(() => { let recBox = document.getElementById("recommendationBox"); if(recBox) { let btn = document.createElement("button"); btn.innerText = "🧠 Recomendar skills con IA"; btn.className = "primary"; btn.style.marginTop = "12px"; btn.onclick = recommendSkills; recBox.appendChild(btn); } }, 100);
loadTemplatesToSelect(); loadFromURL(); renderSkills();