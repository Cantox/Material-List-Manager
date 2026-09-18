// Returns a json list already converted to the correct format
async function openList() {
    const materialList = await openFileJSON( document.getElementById("fileInput").files[0] );
    if(!materialList) return null;

    if(!validMaterialList(materialList)){
        alert("The opened json file is not a compatible item list\n\nIF THE JSON FILE IS THE ONE CREATED BY LITEMATICA, CONVERT IT FIRST TO THE RIGHT FORMAT");
        return null;
    }

    document.getElementById("par0").innerHTML = JSON.stringify(materialList, null, 2).replace(/\n/g, "<br>");
    document.getElementById("par1").innerHTML = "";
    return materialList;
}

function validMaterialList(materialList) {
    if (typeof materialList !== "object" || materialList === null)
        return false;

    if(typeof materialList.name !== "string" || !Array.isArray(materialList.items))
        return false;
    
    for(let i=0; i<materialList.items.length; i++){
        const item = materialList.items[i];
        if(typeof item !== "object" || item === null)
            return false;
        if(typeof item.id !== "string" ||
        typeof item.count !== "number" ||
        typeof item.completed !== "boolean" ||
        typeof item.hidden !== "boolean" ||
        typeof item.notes !== "string" )
            return false;
    }

    return true;
}


// Returns a litematica material list converted to the correct format
async function convertList() {
    const originalList = await openFileJSON( document.getElementById("fileInputOriginalList").files[0] );
    if(!originalList) return null;

    if(!validOriginalMaterialList(originalList)){
        alert("The opened json file is not a compatible item list");
        return null;
    }
    
    document.getElementById("par0").innerHTML = JSON.stringify(originalList, null, 2).replace(/\n/g, "<br>");

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

    document.getElementById("par1").innerHTML = JSON.stringify(materialList, null, 2).replace(/\n/g, "<br>");
    downloadObjectAsJSON(materialList, materialList.name);
    return materialList;
}

function validOriginalMaterialList(materialList) {
    if (typeof materialList !== "object" || materialList === null)
        return false;

    if(typeof materialList.name !== "string" || !Array.isArray(materialList.items))
        return false;
    
    for(let i=0; i<materialList.items.length; i++) {
        const item = materialList.items[i];
        if(typeof item !== "object" || item === null)
            return false;
        if(typeof item.id !== "string" || typeof item.count !== "number")
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