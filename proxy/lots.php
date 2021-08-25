<?php
if (is_numeric($_GET["saleid"]) and is_numeric($_GET["pageno"])) {
    $ch = curl_init("https://www.johnpyeauctions.co.uk/lot_list.asp?saleid=" . $_GET["saleid"] . "&pageno=" . $_GET["pageno"]);
    echo curl_exec($ch);
}
