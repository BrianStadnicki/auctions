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
        // get auctions table and show
        const auctionsTable = indexDoc.querySelector("body > div.container > div > div:nth-child(3) > table:nth-child(1)")
        $("body").append(auctionsTable)
    })
}

function loadLots() {
    loadLotsPage(1, true)
}

function loadLotsPage(page, auto_continue) {
    return $.get("https://cors-anywhere.herokuapp.com/https://www.johnpyeauctions.co.uk/lot_list.asp?" + window.location.search.substring(1) + "&pageno=" + page, function (lotsData) {
        // parse lots page
        const lotsParser = new DOMParser()
        const lotsDoc = lotsParser.parseFromString(lotsData, "text/html")
        // get lots table and show
        const lotsTable = lotsDoc.querySelector("body > div.container > div > div:nth-child(2) > center > table > tbody > tr:nth-child(2) > td > div:nth-child(5) > table")
        $("body").append(lotsTable)
        // automatically continue if should
        if (auto_continue) {
            // check if there is a next link
            if (lotsData.includes("&pageno=" + (page + 1))) {
                loadLotsPage(page + 1, true)
            }
        }
    }).fail(function() {
        console.log("Failed to fetch lots page " + page)
    })
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
