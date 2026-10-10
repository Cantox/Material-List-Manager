document.documentElement.setAttribute("data-theme", "dark");
document.getElementById("themeButton").innerHTML = "<span style='display: inline-block; font-size: 28px;'>⏾</span>";

document.getElementById("sortPanel").style.display = "none";
document.getElementById("calcPanel").style.display = "none";

document.getElementById("calcInput").addEventListener("input", calculate);

clearSite();


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
 
        // BLOCK (icon + id)
        const cId = document.createElement("td");
        const iconWrapper = document.createElement("div");
        iconWrapper.className = "icon_wrapper";
        const icon = document.createElement("div");
        icon.className = getItemClass(item.id);
        icon.style.width = "64px";
        icon.style.height = "64px";
        iconWrapper.appendChild(icon);
        cId.appendChild(iconWrapper);
        cId.appendChild(document.createTextNode( formatBlockName(item.id) ));
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

function getItemClass(id) {
    if(!id || typeof id !== "string") return;

    return "rc-item rc-" + id.replace(":", "_");
}


async function fillRecipies(materialList) {
    const recipiesHolder = document.getElementById("recipiesHolder");
    recipiesHolder.innerHTML = "";
    for(const item of materialList.items) {
        const recipies = await getRecipies(item.id);
        if(!recipies) continue;
        for(const recipie of recipies)
            recipiesHolder.append(recipie);
    }
}


// Clears file inputs and table
async function clearSite() {
    document.querySelector("#listTable tbody").innerHTML = "";
    document.querySelector("#hiddenTable tbody").innerHTML = "";
    const defaultName = "Open a List from the Panel Above";
    document.getElementById("listNameLabel").innerText = defaultName;

    document.getElementById("fileInput").value = "";
    document.getElementById("fileInputOriginalList").value = "";

    const recipiesHolder = document.getElementById("recipiesHolder");
    recipiesHolder.innerHTML = "";
    
    const defaultRecipies = [
        "minecraft:ladder",
        "minecraft:gold_block",
        "minecraft:stone_bricks",
        "minecraft:armor_stand",
        "minecraft:beetroot_soup"
    ];
    
    for(const item of defaultRecipies) {
        const recipies = await getRecipies(item);
        for(const recipie of recipies)
            recipiesHolder.append(recipie);
    }
}


// Toggles between light and dark theme
function toggleTheme() {
    const root = document.documentElement;
    const button = document.getElementById("themeButton");
    if(root.getAttribute("data-theme") === "light") {
        root.setAttribute("data-theme", "dark");
        button.innerHTML = "<span style='display: inline-block; font-size: 28px;'>⏾</span>";
    }
    else {
        root.setAttribute("data-theme", "light");
        button.innerHTML = "<span style='display: inline-block; font-size: 32px;'>☀</span>";
    }
}


// Toggles sort method menu
function toggleSort() {
    const panel = document.getElementById("sortPanel");
    panel.style.display = (panel.style.display === "none") ? "block" : "none";
    document.getElementById("calcPanel").style.display = "none";
}


// Toggles calculator panel
function toggleCalc() {
    const panel = document.getElementById("calcPanel");
    panel.style.display = (panel.style.display === "none") ? "block" : "none";
    document.getElementById("sortPanel").style.display = "none";
}

// Evaluates the written expression (in calc input)
function calculate() {
    const input = document.getElementById("calcInput").value.replace(/\s+/g, ''); // Removes spaces and tabs from input (g = all occurrencies)
    const output = document.getElementById("calcRes");

    if (!/^[0-9+\-*/^().]+$/.test(input)) { // + = at least one char, ^[...]$ = all the string must be made of the specified chars (Checks if this is not respected)
        output.textContent = '= ??';
        return;
    }

    try {
        const jsExpr = input.replace(/\^/g, '**'); // Converts pow symbol to js equivalent (g is for global = all occurrencies)
        
        /* Creates function
        
        "use strict" --> strict mode, better error detection and some dangerous practices are avoided
        return (jsExpr) --> calculates the expression

        the () at the end execute the function immediatly after creation */

        const result = Function('"use strict"; return (' + jsExpr + ')')();

        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) { // check if is a number and if is valid
            output.textContent = '= ??';
        } else {
            output.textContent = '= ' + result;
        }
    } catch (e) {
        output.textContent = '= ??';
    }
}