let ongoingRequests = []

window.onload = function () {
    if (!getUrlParameter("saleid")) {
        console.log("Loading auctions...")
        loadAuctions()
    } else {
        console.log("Loading lots...")
        loadLots()

        window.setInterval(function() {
            if ($("#lots").attr("display") === "initial") {
                console.log("Reloading lots...")
                loadLots()
            }
        }, 15000);
    }
}

window.onpopstate = function (event) {
    cancelAllRequests()
    if (event.state.page === "auctions") {
        loadAuctions()
    } else if (event.state.page === "lots") {
        loadLots()
    }
}

function loadAuctions() {
    $("#lots").css("display", "none")
    $("#auctions").css("display", "initial").empty()

    ongoingRequests.push($.get("/proxy/auctions.php", function (indexData) {
        // remove link's webpage so added to current's params
        indexData = indexData.replaceAll("auction_details.asp", "")

        // parse index page
        const indexParser = new DOMParser()
        const indexDoc = indexParser.parseFromString(indexData, "text/html")

        // get auctions table and show
        const auctionsTable = indexDoc.querySelector("body > div.container > div > div:nth-child(3) > table:nth-child(1)")
        auctionsTable.querySelectorAll("a").forEach(function (auctionLink) {
            auctionLink.href = auctionLink.href + "&favoured=0"
            auctionLink.setAttribute("onclick", "return handleLoadLotsLink(this)")
        })

        $("#auctions").append(auctionsTable)
    }))
}

function loadLots() {
    $("#lots").css("display", "initial")
    $("#auctions").css("display", "none").empty()
    $("#lots-table-body").empty()

    let navLinkAll = $("#lots-nav-link-all").attr("href", getUrlWithParameter(window.location.href, "favoured", 0))
    let navLinkFavoured = $("#lots-nav-link-favoured").attr("href", getUrlWithParameter(window.location.href, "favoured", 1))

    if (getUrlParameter("favoured") === "1") {
        navLinkFavoured.addClass("active")
        navLinkAll.removeClass("active")
    } else {
        navLinkAll.addClass("active")
        navLinkFavoured.removeClass("active")
    }

    loadLotsPage(1, true)
}

function loadLotsPage(page, autoContinue) {
    let request = $.get("/proxy/lots.php?saleid=" + getUrlParameter("saleid") + "&pageno=" + page, function (lotsData) {
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
    ongoingRequests.push(request)
    return request
}

function parseLot(lot) {
    let rowHeight = "50vh" // default to large
    if (getUrlParameter("spacing") === "2") {
        rowHeight = "30vh"
    } else if (getUrlParameter("spacing") === "1") {
        rowHeight = "20vh"
    }

    let lotEntry = $("<tr style='height:" + rowHeight + ";'></tr>")

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
    lotEntry.append("<td><img src='" + lotImage + "' style='height:" + rowHeight + "' onmouseover='handleLotImageHover(this)' onmouseout='handleLotImageUnHover(this)'></td>")
    lotEntry.append("<img src='" + lotImage + "' style='display: none' id='lot-" + lotNumber + "-large-image''>")

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

function handleLotImageHover(element) {
    element = $(element)
    let current = element.parent()
    while (current.next().length) {
        current = current.next()
        current.css("display", "none")
    }
    $("#" + element.parent().parent().attr("id") + "-large-image").css("display", "block")
}

function handleLotImageUnHover(element) {
    element = $(element)
    let current = element.parent()
    while (current.next().length) {
        current = current.next()
        if (current.prop("tagName") === "TD") { current.css("display", "table-cell") }
    }
    $("#" + element.parent().parent().attr("id") + "-large-image").css("display", "none")
}

function handleLoadLotsLink(element) {
    window.history.pushState({page: "lots", scope: "all"}, "Lots", element.getAttribute("href"))
    cancelAllRequests()
    loadLots()
    return false
}

function handleLoadLotsAllLink(element) {
    window.history.pushState({page: "lots", scope: "all"}, "All Lots", element.getAttribute("href"))
    cancelAllRequests()
    loadLots()
    return false
}

function handleLoadLotsFavouredLink(element) {
    window.history.pushState({page: "lots", scope: "favoured"}, "Favoured Lots", element.getAttribute("href"))
    cancelAllRequests()
    loadLots()
    return false
}

function handleLoadAuctionsLink(element) {
    window.history.pushState({page: "auctions"}, "Auctions", element.getAttribute("href"))
    cancelAllRequests()
    loadAuctions()
    return false
}

function handleLoadLotsSpacingLink(element, spacing) {
    window.history.pushState({page: "lots", scope: getUrlParameter("favoured") === "1" ? "all" : "favoured", spacing: spacing }, "Lots", getUrlWithParameter(window.location.href, "spacing", spacing))
    cancelAllRequests()
    loadLots()
    return false
}

function cancelAllRequests() {
    for (let ongoingRequest of ongoingRequests) {
        ongoingRequest.abort()
    }
    ongoingRequests = []
}

function getUrlWithParameter(url, parameter, value) {
    if (url.includes("?" + parameter + "=")) {
        return url.replace("?" + parameter + "=" + getUrlParameterFromURL(url, parameter), "?" + parameter + "=" + value)
    } else if (url.includes("&" + parameter + "=")) {
        return url.replace("&" + parameter + "=" + getUrlParameterFromURL(url, parameter), "&" + parameter + "=" + value)
    } else if (url.indexOf("?") !== url.length - 1) {
        return url + "&" + parameter + "=" + value
    } else if (url.indexOf("?") !== -1) {
        return url + parameter + "=" + value
    } else {
        return url + "?" + parameter + "=" + value
    }
}

function getUrlParameter(param) {
    return getUrlParameterFromURL(window.location.href, param)
}

function getUrlParameterFromURL(url, param) {
    let urlParams = url.substring(url.indexOf("?") + 1)
    let urlVariables = urlParams.split("&")

    for (let i = 0; i < urlVariables.length; i++) {
        let parameterName = urlVariables[i].split("=")

        if (parameterName[0] === param) {
            return typeof parameterName[1] === undefined ? true : decodeURIComponent(parameterName[1])
        }
    }
    return false
}
