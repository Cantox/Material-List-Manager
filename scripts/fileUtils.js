async function convertPathToFile(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const blob = await response.blob();
        const fileName = path.split("/").pop();
        return new File([blob], fileName, { type: "application/json" });
    } catch (e) {
        console.warn("Can't load " + path, e);
        return null;
    }
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

function downloadObjectAsJSON(object, filename = "jsObject.json") {
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