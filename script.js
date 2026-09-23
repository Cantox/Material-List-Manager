const defaultName = "Open a List from the Panel Above";
document.getElementById("listNameLabel").innerText = defaultName;

let currentList = null;

// Opens a json list that is already in the correct format
async function openList() {
    const materialList = await openFileJSON( document.getElementById("fileInput").files[0] );
    if(!materialList) {
        currentList = null;
        return;
    }

    const materialListSchema = {
        id : "string",
        count : "number",
        completed : "boolean",
        hidden : "boolean",
        notes : "string"
    };

    if(!validList(materialList, materialListSchema)){
        alert("The opened json file is not a compatible item list\n\nIF THE JSON FILE IS THE ONE CREATED BY LITEMATICA, CONVERT IT FIRST TO THE RIGHT FORMAT");
        currentList = null;
        return;
    }

    currentList = materialList;
    fillTable(materialList);
}


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


// Converts a litematica list to the correct format and downloads the new json file
async function convertList() {
    const originalList = await openFileJSON( document.getElementById("fileInputOriginalList").files[0] );
    if(!originalList) return;

    const originalListSchema = {
        id : "string",
        count: "number"
    };

    if(!validList(originalList, originalListSchema)){
        alert("The opened json file is not a compatible item list");
        return;
    }

    const materialList = {
        "name": originalList.name,
        "items": []
    };

    for(let i=0; i<originalList.items.length; i++) {
        const item = {
            "id": originalList.items[i].id,
            "count": originalList.items[i].count,
            "completed": false,
            "hidden": false,
            "notes": ""
        };
        materialList.items.push(item);
    }

    downloadObjectAsJSON(materialList, materialList.name);
}



function validList(materialList, itemSchema) {
    if (typeof materialList !== "object" || materialList === null)
        return false;

    if(typeof materialList.name !== "string" || !Array.isArray(materialList.items))
        return false;
    
    for(const item of materialList.items) {
        if(typeof item !== "object" || item === null)
            return false;
        for(const field in itemSchema)
            if(typeof item[field] !== itemSchema[field]) 
                return false;
    }

    return true;
}

function openFileJSON(file) {
    return new Promise((resolve) => {
        if (!file) {
            throwError();
            resolve(null);
            return;
        }
        
        const reader = new FileReader();

        reader.onload = function(event) {
            try { 
                resolve(JSON.parse(event.target.result)); 
            } 
            catch (e) {
                throwError();
                resolve(null);
            }
        };

        reader.onerror = function() {
            throwError();
            resolve(null);
        };

        reader.readAsText(file);
    });
    
    function throwError() {
        alert("Unable to read file, make sure it's JSON");
    }
}

function downloadObjectAsJSON(object, filename = "materialList.json") {
    const jsonString = JSON.stringify(object, null, 2);

    // Creo blob, trattato come file. Specifico contenuto e tipo di file
    const blob = new Blob([jsonString], { type: "application/json" });

    // url temporaneo verso contenuti file
    const url = URL.createObjectURL(blob);

    // Creo link che punta al file
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // quando clicco link mi scarica il file

    // Aggiungo, clicco e rimuovo link al file
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Rimuovo url temporaneo
    URL.revokeObjectURL(url);
}



function clearSite() {
    document.querySelector("#listTable tbody").innerHTML = "";
    document.querySelector("#hiddenTable tbody").innerHTML = "";
    document.getElementById("listNameLabel").innerText = defaultName;

    document.getElementById("fileInput").value = "";
    document.getElementById("fileInputOriginalList").value = "";
}

function saveList() {
    if(!currentList) {
        alert("OPEN A LIST FIRST");
        return;
    }

    downloadObjectAsJSON(currentList, currentList.name);
}