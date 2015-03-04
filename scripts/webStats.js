/**
 * Copyright (c) 2008-2013 GIANTS Software GmbH, Confidential, All Rights Reserved.
 * Copyright (c) 2003-2013 Christian Ammann and Stefan Geiger, Confidential, All Rights Reserved.
 */

// The URL link to the servers XML file
var WEBSTATS_URL = "example.xml";

// Show who and who is not an admin?
var SHOW_WHOS_ADMIN = true;

// Below is the map height and width as determined by the ingame co-ordinates. You can go to the bottom right of the map to retrieve these.
var INGAME_MAP_HEIGHT = 2048;
var INGAME_MAP_WIDTH = 2048;

// The name of the map, including file type.
var IMAGE_MAP_FILE_NAME = "tworiversMap.png";

// Below is the dimensions of the image you wish to put the icons on.
var IMAGE_MAP_HEIGHT = 1024;
var IMAGE_MAP_WIDTH = 1024;

// Image dimensions for the icons that go on the map.
var ICON_IMAGE_HEIGHT = 12;
var ICON_IMAGE_WIDTH = 12;

/* The user-friendly display names for the Legend.
 * If you think I've named something silly, or you wish to mess with your userbase, you may change the machine names below.
 * These names are what appear on the legend, and potentially the map in future releases.
 *
 * The format for changing these is really simply
 *  FRIENDLY_LEGEND_NAMES['do not change me!'] = "WHAT YOU WISH TO NAME IT HERE";
 */
var FRIENDLY_LEGEND_NAMES = {};
FRIENDLY_LEGEND_NAMES['baling'] = "Balers";
FRIENDLY_LEGEND_NAMES['cultivators'] = "Cultivators";
FRIENDLY_LEGEND_NAMES['feeding'] = "Feeding Implements";
FRIENDLY_LEGEND_NAMES['fertilizerSpreaders'] = "Fertilizer Spreaders";
FRIENDLY_LEGEND_NAMES['frontLoaders'] = "Front Loaders";
FRIENDLY_LEGEND_NAMES['harvesters'] = "Harvesters";
FRIENDLY_LEGEND_NAMES['loaderWagons'] = "Loader Wagons";
FRIENDLY_LEGEND_NAMES['manureSpreaders'] = "Manure Spreaders";
FRIENDLY_LEGEND_NAMES['misc'] = "Miscellaneous";
FRIENDLY_LEGEND_NAMES['mowers'] = "Mowers";
FRIENDLY_LEGEND_NAMES['plows'] = "Plows";
FRIENDLY_LEGEND_NAMES['slurryTanks'] = "Slurry Tanks";
FRIENDLY_LEGEND_NAMES['sowingMachines'] = "Sowing Machines";
FRIENDLY_LEGEND_NAMES['sprayers'] = "Sprayers";
FRIENDLY_LEGEND_NAMES['tedders'] = "Tedders";
FRIENDLY_LEGEND_NAMES['tippers'] = "Tippers";
FRIENDLY_LEGEND_NAMES['tractors'] = "Tractors";
FRIENDLY_LEGEND_NAMES['weights'] = "Weights";
FRIENDLY_LEGEND_NAMES['windrowers'] = "Windrowers";


// Display the map
$("#webStatsMap").html("<img src='images/map/" + IMAGE_MAP_FILE_NAME + "' height=" + IMAGE_MAP_HEIGHT + " width=" + IMAGE_MAP_WIDTH + " style='position: relative; top: 0; left: 0; border:1px solid black;' />");
var currentPlayers = [];
var vehicleShowDisabled = [];

function loadWebStats() {

    function Update() {

        $.get(WEBSTATS_URL, function (data) {

            var Server = $(data).find("Server");
            if (Server != null) {
                $("#webStatsName").text($(Server).attr("name"));
                $("#webStatsMapName").text($(Server).attr("mapName"));
                $("#webStatsMoney").text($(Server).attr("money"));
                $("#webStatsPlayersAllowed").text($(data).find("Server Slots").attr("capacity"));
                $("#webStatsPlayersOnline").text($(data).find("Server Slots").attr("numUsed"));


                // Add a . in the UNIX time string, then produce a date.
                // Disabled for now.
                /*
                var time = $(Server).attr("dayTime");
                time = ((time.slice(0, time.length - 3)) + "." + (time.slice(time.length - 3, time.length)));
                var date = new Date(time * 1000);
                $("#webStatsServerTime").text(date.getHours()+5 + ":" + date.getMinutes());
                */

                var wealth = $(Server).attr("money");
                $("#webStatsMoney").text(formatMoney(wealth));


                var playerSlots = [];
                var webStatsPlayers = $("#webStatsPlayers");
                $("#webStatsPlayers").find("tr:gt(0)").remove(); //removes all of the table rows but the header
                var Players = $(data).find("Server Slots Player");
                if (webStatsPlayers != null && Players != null) {
                    var oddOrEven = 0;
                    Players.each(function (index, element) {


                        //Determine what class to put on the row.

                        var Player = $(element);
                        playerSlots.push(Player.text());
                        if (Player.attr("isUsed") == "true") {

                            var uptime = Player.attr("uptime");
                            var hours = Math.floor(uptime / 60);
                            var minutes = Math.floor(uptime - (hours * 60));

                            // Allows us to show the admin badge IF SHOW_WHOS_ADMIN is set to true, otherwise assumes they are a player.
                            var adminStr = "<p class='centeredBadge'><img src='images/PlayerRanks/player.png' alt='player' /></p>";
                            if (SHOW_WHOS_ADMIN) {
                                if (Player.attr("isAdmin") == "true") {
                                    adminStr = "<p class='centeredBadge'><img src='images/PlayerRanks/admin.png' alt='admin' /></p>";
                                }
                            }
                            adminStr = "<td>" + adminStr + "</td>";

                            if (minutes < 10) { minutes = "0" + minutes; }
                            webStatsPlayers.append("<tr" + oddOrEvenClass(oddOrEven) + "><td style='font-weight:bold;'>" + Player.text() + "</td><td>" + hours + ":" + minutes + " Hour(s)</td>" + adminStr + "</tr>");
                            playerJoinCheck(Player.text());
                        } else {
                            webStatsPlayers.append("<tr" + oddOrEvenClass(oddOrEven) + "><td style='font-weight:bold;'>Empty</td><td></td><td></td></tr>");
                        }
                        oddOrEven++;
                    });
                    playerLeftCheck(playerSlots);
                }


                var webStatsVehicles = $("#webStatsVehicles");
                // We need to reset the html of the span tag so that the previous image locations are reset.
                webStatsVehicles.html("<!-- Dynamic content from JS -->")
                var Vehicles = $(data).find("Server Vehicles Vehicle");
                var vehicleTypes = [];
                if (webStatsVehicles != null && Vehicles != null) {
                    var vehicleImageHTML = ""
                    Vehicles.each(function (index, element) {
                        var vehicle = $(element);
                        var vehicleName = vehicle.attr("name");
                        var vehicleType = vehicle.attr("machineType");

                        // Compile a list of machine types in the game and add only unique ones so we can build a legend.
                        if (vehicleTypes.indexOf(vehicleType) == -1) {
                            vehicleTypes.push(vehicleType);
                            // Check to see if the check box exists, and if so if it is false. If false we add that vehicle type to an array to skip it in other steps.
                            if (document.getElementById(vehicleType) != null) {
                                if (document.getElementById(vehicleType).checked == false) {
                                    vehicleShowDisabled.push(vehicleType);
                                }
                            }
                        }

                        // Here we check if we should skip the vehicle if the checkbox is false.
                        if (vehicleShowDisabled.indexOf(vehicleType) < 0) {
                            var mapRescale = INGAME_MAP_HEIGHT / IMAGE_MAP_HEIGHT;
                            // We grab the position of the vehicle, add half the size of the map as the position is provided from the center. We wish to work from the top left.
                            // We then want to resize it to the image map then round it. We then take off half the size of the icon.
                            var xPosition = Math.round((Math.round(vehicle.attr("x")) + (INGAME_MAP_WIDTH / 2)) / mapRescale) - (ICON_IMAGE_WIDTH / 2);
                            var zPosition = Math.round((Math.round(vehicle.attr("z")) + (INGAME_MAP_HEIGHT / 2)) / mapRescale) - (ICON_IMAGE_HEIGHT / 2);

                            webStatsVehicles.append("<img src='images/icons/" + vehicleType + ".png' alt='" + vehicleName + "' style='position: absolute; top: " + zPosition + "; left: " + xPosition + ";' />");
                        }

                    });
                }

                generateLegend(vehicleTypes);



            }
        });
    }

    Update();
    setInterval(Update, 60000);// every 1 minute

}

/*
 * formatMoney
 *
 * Formats money into the standard $###,###
 *
 * @param {integer} wealth - the value that you wish to format.
 * @returns {string} as "$###,###".
 */
function formatMoney(wealth) {
    var formattedWealth = "";
    // Count through the numbers starting from the 'end'
    for (i = (wealth.length - 1) ; i > -1; i--) {
        formattedWealth = wealth[i] + formattedWealth;
        if ((i - wealth.length) % 3 == 0 && i != 0) {
            formattedWealth = "," + formattedWealth;
        }
    }
    return ('$' + formattedWealth);
}


/*
 * playerLeftCheck
 *
 * Checks to see if a player has left the server.
 *
 * @param {array} playerSlots - an array of players currently on the server.
 */
function playerLeftCheck(playerSlots) {
    for (var i in currentPlayers) {
        if (playerSlots.indexOf(currentPlayers[i]) < 0) {
            console.log(currentPlayers[i] + " has left");
            currentPlayers.splice(i, 1);
        }
    }
}

/*
 * playerJoinCheck
 *
 * Checks to see if a player has joined the server.
 *
 * @param {string} username - the username of the player you wish to check.
 */
function playerJoinCheck(username) {
    var isNewPlayer = currentPlayers.indexOf(username);
    if (isNewPlayer < 0) {
        currentPlayers.push(username);
        console.log(username + " has joined");
    }
}

/*
 * generateLegend
 *
 * Generates a legend for the server map
 *
 * @param {array} vehicleTypes - A list of vehicles that are currently on the map.
 */
function generateLegend(vehicleTypes) {
    vehicleTypes.sort()
    var mapLegendTable = $("#mapLegendTable");
    $("#mapLegendTable").find("tr:gt(0)").remove(); // Remove all from the table but the header.
    for (var i in vehicleTypes) {
        var checked = "checked = 'checked'"
        // Check to see if the vehicleType is on the unchecked list.
        if (vehicleShowDisabled.indexOf(vehicleTypes[i]) >= 0) { checked = ""; }
        mapLegendTable.append("<tr" + oddOrEvenClass(i) + "><td><input type='checkbox' id='" + vehicleTypes[i] + "' " + checked + " onclick='loadWebStats()'></td><td>" + FRIENDLY_LEGEND_NAMES[vehicleTypes[i]] + "</td><td><img src='images/icons/" + vehicleTypes[i] + ".png' /></td></tr>");
    }
}

/*
 * oddOrEvenClass
 *
 * Determines if a number is odd or even and returns a class value
 *
 * @param {integer} checkValue - a value to be checked if it's odd or even.
 * @returns {string} A string in the style of CSS class, either blank or "class='alt'".
 */
function oddOrEvenClass(checkValue) {
    var rowClass = "";
    if (checkValue % 2 == 1) {
        var rowClass = " class='alt'";
    }
    return rowClass;
}