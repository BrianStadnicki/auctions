window.onload = function () {
    if (!getUrlParameter("saleid")) {
        console.log("Loading auctions...")
        loadAuctions()
    } else {
        console.log("Loading lots...")
        loadLots()
    }
}

function loadAuctions() {
    $.get("https://cors-anywhere.herokuapp.com/https://www.johnpyeauctions.co.uk/index.asp", function (indexData) {
        // remove link's webpage so added to current's params
        indexData = indexData.replaceAll("auction_details.asp", "")
        // parse index page
        const indexParser = new DOMParser()
        const indexDoc = indexParser.parseFromString(indexData, "text/html")
        // get auctions table and append to #select-auction
        const auctionsTable = indexDoc.querySelector("body > div.container > div > div:nth-child(3) > table:nth-child(1)")
        $("body").append(auctionsTable)
    })
}

function loadLots() {

}

function getUrlParameter(sParam) {
    let sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
}
