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
        auctionsTable.querySelectorAll("a").forEach(function (auctionLink) {
            auctionLink.href = auctionLink.href + "&favoured=0"
        })
        $("#auctions").append(auctionsTable)
    })
}

function loadLots() {
    $("#lots").css("visibility", "visible")
    $("#lots > nav > div > a:nth-child(2)").attr("href", "auctions.html?" + window.location.search.substring(1).replace("favoured=1", "favoured=0"))
    $("#lots > nav > div > a:nth-child(3)").attr("href", "auctions.html?" + window.location.search.substring(1).replace("favoured=0", "favoured=1"))
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
    let lotEntry = $("<tr></tr>")

    // lot link
    let lotLink = lot.querySelector("td:nth-child(1) > a").getAttribute("href")

    // lot number
    let lotNumber = lot.querySelector("td:nth-child(1) > a > h5").textContent
    let auction = getUrlParameter("saleid")
    let lotStorage = JSON.parse(window.localStorage.getItem("lot-" + auction + "-" + lotNumber))
    if (lotStorage && lotStorage.favoured) {
        lotEntry.append("<th scope='row' style='position: relative'><h3>" + lotNumber + "<br>" +
            "<svg style='position: absolute; top: 50%' onclick='unfavouredLot(" + lotNumber + ")' xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" fill=\"currentColor\" class=\"bi bi-star-fill clickable\" viewBox=\"0 0 16 16\">\n" +
            "  <path d=\"M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z\"/>\n" +
            "</svg>" + "</h3></th>")
    } else {
        if (getUrlParameter("favoured") === "1") {
            return $("")
        } else {
            lotEntry.append("<th scope='row' style='position: relative'><h3>" + lotNumber + "<br>" +
                "<svg style='position: absolute; top: 50%' onclick='favouriteLot(" + lotNumber + ")'  xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" fill=\"currentColor\" class=\"bi bi-star clickable\" viewBox=\"0 0 16 16\">\n" +
                "  <path d=\"M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z\"/>\n" +
                "</svg>" + "</h3></th>")
            if (!lotStorage) {
                const lotJSON = {
                    favoured: false
                }
                window.localStorage.setItem("lot-" + auction + "-" + lotNumber, JSON.stringify(lotJSON))
            }
        }
    }

    // add lot number as id to lot entry
    lotEntry.attr("id", "lot-" + lotNumber)

    // lot preview image
    let lotImage = lot.querySelector("td:nth-child(2) > a").getAttribute("data-img")
    lotEntry.append("<td><img src='" + lotImage + "' width=500></td>")

    // lot title
    let lotTitle = lot.querySelector("td:nth-child(3) > a > h5").textContent.replace(/THIS PRODUCT IS FULLY FUNCTIONAL.*/, "")

    lotEntry.append("<td><a href='" + lotLink + "'><h2>" + lotTitle + "</h2></a></td>")

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

    for (let i = 1; i < lotEntry.children().length - 1; i++) {
        lotEntry.eq(i).attr("onclick", "window.open('" + lotLink + "')")
    }

    return lotEntry
}

function favouriteLot(lot) {
    $('#lot-' + lot + ' > th > h3 > svg').replaceWith("<svg style='position: absolute; top: 50%' onclick='unfavouredLot(" + lot + ")' xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" fill=\"currentColor\" class=\"bi bi-star-fill clickable\" viewBox=\"0 0 16 16\">\n" +
        "  <path d=\"M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z\"/>\n" +
        "</svg>")
    let auction = getUrlParameter("saleid")
    const lotJSON = JSON.parse(window.localStorage.getItem("lot-" + auction + "-" + lot))
    lotJSON.favoured = true
    window.localStorage.setItem("lot-" + auction + "-" + lot, JSON.stringify(lotJSON))
}

function unfavouredLot(lot) {
    $('#lot-' + lot + ' > th > h3 > svg').replaceWith("<svg style='position: absolute; top: 50%' onclick='favouriteLot(" + lot + ")'  xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" fill=\"currentColor\" class=\"bi bi-star clickable\" viewBox=\"0 0 16 16\">\n" +
        "  <path d=\"M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z\"/>\n" +
        "</svg>")
    let auction = getUrlParameter("saleid")
    const lotJSON = JSON.parse(window.localStorage.getItem("lot-" + auction + "-" + lot))
    lotJSON.favoured = false
    window.localStorage.setItem("lot-" + auction + "-" + lot, JSON.stringify(lotJSON))

    if (getUrlParameter("favoured") === "1") {
        $('#lot-' + lot).remove()
    }
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
