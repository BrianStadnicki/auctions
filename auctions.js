window.onload = function () {
    if (!getUrlParameter("saleid")) {
        console.log("Loading auctions...")
        loadAuctions()
    } else {
        console.log("Loading lots...")
        loadLots()

        window.setInterval(function(){
            console.log("Reloading lots...")
            loadLots()
        }, 15000);
    }
}

function loadAuctions() {
    $("#auctions").css("visibility", "visible")
    $.get("https://cors-anywhere.herokuapp.com/https://www.johnpyeauctions.co.uk/index.asp", function (indexData) {
        // remove link's webpage so added to current's params
        indexData = indexData.replaceAll("auction_details.asp", "")

        // parse index page
        const indexParser = new DOMParser()
        const indexDoc = indexParser.parseFromString(indexData, "text/html")

        // get auctions table and show
        const auctionsTable = indexDoc.querySelector("body > div.container > div > div:nth-child(3) > table:nth-child(1)")
        $("#auctions").append(auctionsTable)
    })
}

function loadLots() {
    $("#lots").css("visibility", "visible")
    loadLotsPage(1, true)
}

function loadLotsPage(page, autoContinue) {
    return $.get("https://cors-anywhere.herokuapp.com/https://www.johnpyeauctions.co.uk/lot_list.asp?" + window.location.search.substring(1) + "&pageno=" + page, function (lotsData) {
        // add link's webpage
        lotsData = lotsData.replaceAll("lot_details.asp", "https://www.johnpyeauctions.co.uk/lot_details.asp")

        // parse lots page
        const lotsParser = new DOMParser()
        const lotsDoc = lotsParser.parseFromString(lotsData, "text/html")

        // get lots table
        const lotsTable = lotsDoc.querySelector("body > div.container > div > div:nth-child(2) > center > table > tbody > tr:nth-child(2) > td > div:nth-child(5) > table > tbody")

        // loop over all lots entries
        let lots = lotsTable.querySelectorAll("tr:not(:first-child)")
        lots.forEach(lot => {
            let lotEntry = parseLot(lot)
            let existingLotEntry = $("#" + lotEntry.attr("id"))

            if (existingLotEntry.length !== 0) {
                existingLotEntry.replaceWith(lotEntry)
            } else {
                $("#lots-table-body").append(lotEntry)
            }
        })

        // automatically continue if should
        if (autoContinue) {

            // check if there is a next link
            if (lotsData.includes("&pageno=" + (page + 1))) {
                loadLotsPage(page + 1, true)
            }
        }
    }).fail(function() {
        console.log("Failed to fetch lots page " + page)
    })
}

function parseLot(lot) {
    let lotEntry = $("<tr class='clickable'></tr>")

    // lot link
    let lotLink = lot.querySelector("td:nth-child(1) > a").getAttribute("href")
    lotEntry.attr("onclick", "window.open('" + lotLink + "')")

    // lot number
    let lotNumber = lot.querySelector("td:nth-child(1) > a > h5").textContent
    lotEntry.append("<th scope='row'><h3>" + lotNumber + "</h3></th>")

    // add lot number as id to lot entry
    lotEntry.attr("id", "lot-" + lotNumber)

    // lot preview image
    let lotImage = lot.querySelector("td:nth-child(2) > a").getAttribute("data-img")
    lotEntry.append("<td><img src='" + lotImage + "' width=500></td>")

    // lot title
    let lotTitle = lot.querySelector("td:nth-child(3) > a > h5").textContent.replace(/THIS PRODUCT IS FULLY FUNCTIONAL.*/, "")

    lotEntry.append("<td><h2>" + lotTitle + "</h2></td>")

    // lot bid
    let lotBid = lot.querySelector("td:nth-child(4) > a > h5").textContent
    lotEntry.append("<td><h2>" + lotBid + "</h2></td>")

    // lot time left
    let lotTimeRaw = lot.querySelector("td:nth-child(5) > a:first-child > h5").textContent
    let lotTime
    {
        // easily get the time left of unit from string
        function getTime(ends, units) {
            return ends.substring( ends.substring(0, units).lastIndexOf(' ')+1, units)
        }

        // parse lot time left
        lotTime = new Date().getTime()
        for (let i = 0; i < lotTimeRaw.length; i++) {
            switch (lotTimeRaw.charAt(i)) {
                case 'd':
                    lotTime += getTime(lotTimeRaw, i) * 1000 * 60 * 60 * 24
                    break
                case 'h':
                    lotTime += getTime(lotTimeRaw, i) * 1000 * 60 * 60
                    break
                case 'm':
                    lotTime += getTime(lotTimeRaw, i) * 1000 * 60
                    break
                case 's':
                    lotTime += getTime(lotTimeRaw, i) * 1000
            }
        }

    }

    // append countdown entry, div and script
    lotEntry.append("<td><h2 id='countdown-" + lotNumber + "'></h2></td>")
        .append(
            "<script>\
            $('#countdown-" + lotNumber + "').countdown(" + lotTime + ", function(event) {\
                        $(this).text(event.strftime('%H:%M:%S'))\
                    })\
                    </script>\
                    "
        )

    return lotEntry
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
