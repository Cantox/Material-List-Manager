let currentList = null;

const originalListSchema = {
    id : "string",
    count: "number"
};

const materialListSchema = {
    id : "string",
    // item: "string" // Item png path (css class ??)
    // recipie: "string" // Crafting json file (directly from .jar)
    count : "number",
    completed : "boolean",
    hidden : "boolean",
    notes : "string"
};

// Opens a json list that is already in the site format
async function openList() {
    const materialList = await openFileJSON( document.getElementById("fileInput").files[0] );
    if(!materialList) {
        currentList = null;
        return;
    }

    if(!validList(materialList, materialListSchema)){
        alert("The opened json file is not a compatible item list\n\nIF THE JSON FILE IS THE ONE CREATED BY LITEMATICA, CONVERT IT FIRST TO THE RIGHT FORMAT");
        currentList = null;
        return;
    }

    currentList = materialList;
    fillTable(materialList);
}

// Converts a litematica list to the site format and downloads the new json file
async function convertList() {
    const originalList = await openFileJSON( document.getElementById("fileInputOriginalList").files[0] );
    if(!originalList) return;

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

// Checks if the js object is a valid material list based on the given item schema
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

// Downloads the currently opened list as a json file
function saveList() {
    if(!currentList) {
        alert("OPEN A LIST FIRST");
        return;
    }

    downloadObjectAsJSON(currentList, currentList.name);
}

// Sorts the items of the currently opened list based on the given criteria
function sortItems(criteria) {
    if(!currentList) return;

    const validSorts = {
        id: (a, b) => formatBlockName(a.id).localeCompare( formatBlockName(b.id) ),
        idReversed: (a, b) => formatBlockName(b.id).localeCompare( formatBlockName(a.id) ),
        amount: (a, b) => b.count - a.count,
        amountReversed: (a, b) => a.count - b.count,
        completed: (a, b) => Number(b.completed) - Number(a.completed),
        completedReversed: (a, b) => Number(a.completed) - Number(b.completed),
        category: null
    };

    if(validSorts[criteria])
        currentList.items.sort(validSorts[criteria]);

    fillTable(currentList);
}