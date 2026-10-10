// ! ADD RECIPIE SEARCHING

const recipieDir = "./Assets/Recipies/";

function getBlockName(id) {
    return id
        .replace("minecraft:", "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}

function getRecipieName(id) {
    return id.replace("minecraft:", "") + ".json";
}

function getIconClassName(id) {
    return "rc-item rc-" + id.replace(/:/g, "_");
}



async function getRecipies(id) {
    const file = await convertPathToFile( recipieDir + getRecipieName(id) );
    if(!file) return null;

    const itemRecipies = await openFileJSON(file);
    const recipieDivs = [];

    for(const recipie of itemRecipies.recipies) {
        const recipieDiv = document.createElement("div");
        recipieDiv.className = "recipie";

        // NAME LABEL
        const nameLabel = document.createElement("label");
        nameLabel.innerText = getBlockName(id);
        recipieDiv.append(nameLabel);

        const grid = document.createElement("table");
        for(let i=0; i<3; i++) {
            const row = document.createElement("tr");
            for(let j=0; j<3; j++) {
                const cell = document.createElement("td");
                const icon = document.createElement("div");
                icon.className = (recipie[(i*3)+j] !== "") ? getIconClassName(recipie[(i*3)+j]) : getIconClassName("renderchest_empty");
                cell.append(icon);
                row.append(cell);
            }
            grid.append(row);
        }
        recipieDiv.append(grid);

        recipieDivs.push(recipieDiv);
    }

    return recipieDivs;
}