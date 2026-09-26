const defaultName = "Open a List from the Panel Above";
document.getElementById("listNameLabel").innerText = defaultName;

document.documentElement.setAttribute("data-theme", "dark");

document.getElementById("sortPanel").style.display = "none";
document.getElementById("calcPanel").style.display = "none";


// Displays list in the table
function fillTable(materialList) {
    const listBody = document.querySelector("#listTable tbody");
    const hiddenBody = document.querySelector("#hiddenTable tbody");

    document.getElementById("listNameLabel").innerText = materialList.name;

    // Remove any previously rendered rows
    listBody.innerHTML = "";
    hiddenBody.innerHTML = "";
 
    for (let i = 0; i < materialList.items.length; i++) {
        const item = materialList.items[i];
        const table = (item.hidden) ? hiddenBody : listBody;
 
        const r = document.createElement("tr");
 
        // BLOCK
        const cId = document.createElement("td");
        cId.textContent = formatBlockName(item.id);
        r.appendChild(cId);
 
        // AMOUNT
        const cCount = document.createElement("td");
        cCount.innerHTML = item.count + "<br>" + (item.count/64).toFixed(1) + " (x64)<br>" + (item.count/64/27).toFixed(2) + " (SB)";
        r.appendChild(cCount);
 
        // COMPLETED
        const cCompleted = document.createElement("td");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = item.completed;
        if (item.completed) r.classList.add("completed");
        input.addEventListener("change", () => {
            item.completed = input.checked;
            fillTable(materialList);
        });
        cCompleted.appendChild(input);
        r.appendChild(cCompleted);

        // HIDE
        const cHide = document.createElement("td");
        const hideInput = document.createElement("input");
        hideInput.type = "checkbox";
        hideInput.checked = item.hidden;
        hideInput.addEventListener("change", () => {
            item.hidden = hideInput.checked;
            fillTable(materialList);
        });
        cHide.appendChild(hideInput);
        r.appendChild(cHide);
 
        // NOTES
        const cNotes = document.createElement("td");
        const notesTextArea = document.createElement("textArea");
        notesTextArea.innerText = item.notes;
        notesTextArea.addEventListener("change", () => {
            item.notes = notesTextArea.value;
        });
        cNotes.appendChild(notesTextArea);
        r.appendChild(cNotes);
 
        table.appendChild(r);
    }
}

function formatBlockName(id) {
    return id
        .replace(/^minecraft:/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}


// Clears file inputs and table
function clearSite() {
    document.querySelector("#listTable tbody").innerHTML = "";
    document.querySelector("#hiddenTable tbody").innerHTML = "";
    document.getElementById("listNameLabel").innerText = defaultName;

    document.getElementById("fileInput").value = "";
    document.getElementById("fileInputOriginalList").value = "";
}


// Toggles between light and dark theme
function toggleTheme() {
    const root = document.documentElement;
    root.setAttribute("data-theme", root.getAttribute("data-theme") === "light" ? "dark" : "light");
}


// Toggles sort method menu
function toggleSort() {
    const panel = document.getElementById("sortPanel");
    panel.style.display = (panel.style.display === "none") ? "block" : "none";
}


// Toggles calculator panel
function toggleCalc() {
    const panel = document.getElementById("calcPanel");
    panel.style.display = (panel.style.display === "none") ? "block" : "none";
}

// Evaluates the written expression (in calc input)
function calculate() {
    const input = document.getElementById("calcInput").value;
    const output = document.getElementById("calcRes");

    const cleaned = input.replace(/\s+/g, '');
    if (!/^[0-9+\-*/^().]+$/.test(cleaned)) {
        output.textContent = '= ??';
        return;
    }

    try {
        const jsExpr = cleaned.replace(/\^/g, '**');
        const result = Function('"use strict"; return (' + jsExpr + ')')();

        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            output.textContent = '= ??';
        } else {
            output.textContent = '= ' + result;
        }
    } catch (e) {
        output.textContent = '= ??';
    }
}