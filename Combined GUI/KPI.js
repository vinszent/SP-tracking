// Average throughput
function showKPI() {
    console.log("Starting stuff up");

    function createTable(parentNodeId, tableHeaders, data) {
	// Place holder
    }

    document.getElementById('fullorderbtn').onclick = function() {
	makeQuery(makeUrl('fullUpdate'), responseHandler);
    };
    document.getElementById('orderbtn').onclick = function() {
	makeQuery(makeUrl('orders'), responseHandler);
    };
}


// Made a short table of what I could find as possible queries
// currently. I am not quite sure of how to get a hold of the
// order ID's.
//
// ################# Possible queries ########################
//
// Color:      ?requestType=color&compId=<ID>
// Cycle time: ?requestType=cycletime&orderId=<ID>
// History:    ?requestType=history&orderId=<ID>&compId=<ID>
// Throughput: ?requestType=throughput
// 
// ###########################################################

//var serverAddress = "http://192.168.0.141:8000/root"
var serverAddress = "http://localhost:8000"

function makeQuery(getUrl, callback)
{
    console.log("Sending query...")
    console.log(getUrl)
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
	console.log("State: " + this.readyState)
	console.log("Status: " + this.status)
	console.log("Status Text: " + this.statusText)
	if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
	    console.log("Status OK!");
	    callback(xmlHttp.responseText);
	}
    };
    xmlHttp.open("GET", getUrl, true);
    xmlHttp.send(null);
}

function makeUrl(requestType, orderId, compId) {
    var url = serverAddress + "?requestType=" + requestType;
    if (orderId !== undefined || orderId !== null)
	url += "&orderId=" + orderId;
    if (compId !== undefined || compId !== null)
	url += "&compId=" + compId;
    return url;
}


function responseHandler(responseText) {
    console.log("Server response: " + responseText);
    response = JSON.parse(responseText);
    switch (response.requestType) {
    case "fullUpdate":
	updateFull(response);
	break;
    case "orders":
	updateOrders(response);
	break;
    case "components":
	updateComponents(response);
	break;
    case "orderHistory":
	updateOrderHistory(response);
	break;
    case "componentHistory":
	updateComponentHistory(response);
	break;
    default:
	console.log("Unknown response type " + response.type);
	console.log("Can't handle input data:");
	console.log(responseText);
    }
}

// The response contains the order id:s.
function updateOrders(response) {
    var orders = response.orders;

    var div = document.getElementById('orderlist');
    if (document.getElementById('ordertable') !== null) {
	var table = document.getElementById('ordertable');
	table.parentNode.removeChild(table);
    }
    div.innerHTML = 'Orders';
    
    var table = document.createElement('table');
    table.id = 'ordertable';

    var topRow = table.insertRow();
    topRow.classList.add('toprow');
    var idCell = topRow.insertCell();
    idCell.innerHTML = 'ID';
    
    for (var i in orders) {
	var row = table.insertRow();
	var cell = row.insertCell();
	cell.innerHTML = orders[i];
	row.addEventListener('click', function() {
	    makeQuery(makeUrl('orderHistory',
			      this.childNodes[0].innerHTML),
		      responseHandler);
	    makeQuery(makeUrl('components',
			      this.childNodes[0].innerHTML),
		      responseHandler);
	});
	
    }
    div.appendChild(table);
}

function updateComponents(response) {
    var comps = response.components;

    var div = document.getElementById('componentlist');
    if (document.getElementById('componenttable') !== null) {
	var table = document.getElementById('componenttable');
	table.parentNode.removeChild(table);
    }
    div.innerHTML = 'Components';
    
    var table = document.createElement('table');
    table.id = 'componenttable';

    var topRow = table.insertRow();
    topRow.classList.add('toprow');
    var idCell = topRow.insertCell();
    idCell.innerHTML = 'ID';
    
    for (var i in comps) {
	var row = table.insertRow();
	var cell = row.insertCell();
	cell.innerHTML = comps[i];
	row.addEventListener('click', function() {
	    makeQuery(makeUrl('componentHistory',
			      response.orderId,
			      this.childNodes[0].innerHTML),
		      responseHandler);
	});
	
    }
    div.appendChild(table);
}

function updateOrderHistory(response) {
    var times = response.times;
    var resources = response.resources;
    var actions = response.actions;

    var div = document.getElementById('orderhistory');
    if (document.getElementById('orderhistorytable') !== null) {
	var table = document.getElementById('orderhistorytable');
	table.parentNode.removeChild(table);
    }
    div.innerHTML = 'Order History for order ' + response.orderId;
    
    var table = document.createElement('table');
    table.id = 'orderhistorytable';

    var topRow = table.insertRow();
    topRow.classList.add('toprow');
    var timeCell = topRow.insertCell();
    timeCell.innerHTML = 'Time';
    var resourceCell = topRow.insertCell();
    resourceCell.innerHTML = 'Resource';
    var actionCell = topRow.insertCell();
    actionCell.innerHTML = 'Action';
    
    for (var i in times) {
	var row = table.insertRow();
	var cell = row.insertCell();
	var datetime = new Date(0);
	var splitTime = String(times[i]).split('.');
	datetime.setUTCSeconds(splitTime[0], splitTime[1])
	cell.innerHTML = ('Y-M-D h:m:s.k'
			  .replace('Y', datetime.getFullYear())
			  .replace('M', datetime.getMonth()+1)
			  .replace('D', datetime.getDate())
			  .replace('h', datetime.getHours())
			  .replace('m', datetime.getMinutes())
			  .replace('s', datetime.getSeconds())
			  .replace('k', datetime.getMilliseconds()));
	cell = row.insertCell();
	cell.innerHTML = resources[i];
	cell = row.insertCell();
	cell.innerHTML = actions[i];
    }

    div.appendChild(table);
}

function updateComponentHistory(response) {
    var times = response.times;
    var resources = response.resources;
    var actions = response.actions;

    var div = document.getElementById('componenthistory');
    if (document.getElementById('componenthistorytable') !== null) {
	var table = document.getElementById('componenthistorytable');
	table.parentNode.removeChild(table);
    }
    div.innerHTML = 'Component History for component ' + response.compId;
    
    var table = document.createElement('table');
    table.id = 'orderhistorytable';

    var topRow = table.insertRow();
    topRow.classList.add('toprow');
    var timeCell = topRow.insertCell();
    timeCell.innerHTML = 'Time';
    var resourceCell = topRow.insertCell();
    resourceCell.innerHTML = 'Resource';
    var actionCell = topRow.insertCell();
    actionCell.innerHTML = 'Action';
    
    for (var i in times) {
	var row = table.insertRow();
	var cell = row.insertCell();
	var datetime = new Date(0);
	var splitTime = String(times[i]).split('.');
	datetime.setUTCSeconds(splitTime[0], splitTime[1])
	cell.innerHTML = ('Y-M-D h:m:s.k'
			  .replace('Y', datetime.getFullYear())
			  .replace('M', datetime.getMonth()+1)
			  .replace('D', datetime.getDate())
			  .replace('h', datetime.getHours())
			  .replace('m', datetime.getMinutes())
			  .replace('s', datetime.getSeconds())
			  .replace('k', datetime.getMilliseconds()));
	cell = row.insertCell();
	cell.innerHTML = resources[i];
	cell = row.insertCell();
	cell.innerHTML = actions[i];
    }

    div.appendChild(table);
}

// For fullupdate, response is
// {"requestType":"listorders",
//  "orders":[
//   {"id":<ID>,
//    "cycletime":<CYCLETIME>,
//    "components":[<COMPONENTS>],
//    "history":[<ORDER HISTORIES>]
//   }
//  ]
// }
function updateFull(response) {

    orders = response.orders;

    // List all the components in the order when the order row is
    // clicked, in a new table. This is basically the same function
    // as that for making the table for the orders. There is
    // probably a nicer solution in making a 'createTable'
    // function, but I don't have time to optimize rigth now.
    function showComps(idx) {
	console.log("Row " + idx + " clicked!");
	
	var comps = orders[idx - 1].components;

	var compDiv = document.getElementById('componentlist');
	if (document.getElementById('componenttable') !== null) {
	    var compTable = document.getElementById('componenttable')
	    compDiv.removeChild(compTable);
	}
	if (document.getElementById('componenthistorytable') !== null) {
	    var histTable = document.getElementById('componenthistorytable')
	    histTable.parentNode.removeChild(histTable);
	}
	var compTable = document.createElement('table');
	compTable.id = 'componenttable';

	compDiv.innerHTML = 'Components';
	
	var topRow = compTable.insertRow();
	topRow.classList.add('toprow');
	var idCell = topRow.insertCell();
	idCell.innerHTML = 'ID';
	var compCell = topRow.insertCell();
	compCell.innerHTML = 'Color';	
	var histCell = topRow.insertCell();
	histCell.innerHTML = 'History';
	
	for (var i in comps) {
	    console.log(i);
	    console.log(comps[i]);
	    var row = compTable.insertRow();
	    row.addEventListener('click', function() {
		showCompHist(idx, this.rowIndex);
	    });
	    var cells = [];
	    for (var key in comps[i]) {
		cells.push(row.insertCell());
		if (!(Array.isArray(comps[i][key]))) { 
		    cells[cells.length -
			  1].appendChild(document.createTextNode(comps[i][key]));
		} else {
		    cells[cells.length -
			  1].appendChild(document.createTextNode(comps[i][key].length));
		}
	    }
	}
	compDiv.appendChild(compTable);
    }

    function showOrderHist(idx) {
	var history = orders[idx - 1].history;
	
	console.log("Row " + idx + " clicked!");

	var histDiv = document.getElementById('orderhistory');
	if (document.getElementById('orderhistorytable') !== null) {
	    var histTable = document.getElementById('orderhistorytable')
	    histDiv.removeChild(histTable);
	}
	var histTable = document.createElement('table');
	histTable.id = 'orderhistorytable';

	histDiv.innerHTML = 'Order History';
	
	var topRow = histTable.insertRow();
	topRow.classList.add('toprow');
	var idCell = topRow.insertCell();
	idCell.innerHTML = 'Times';
	var compCell = topRow.insertCell();
	compCell.innerHTML = 'Resources';	
	var histCell = topRow.insertCell();
	histCell.innerHTML = 'Actions';
	
	for (var i in history.times) {
	    console.log(i);
	    console.log(history[i]);
	    var row = histTable.insertRow();
	    var cells = [];
	    for (var key in history) {
		cells.push(row.insertCell());
		// First array is the times given as POSIX.
		if (key === 'times') {
		    var date = new Date(0);
		    date.setUTCSeconds(history[key][i]);
		    cells[cells.length -
			  1].appendChild(document.createTextNode(
			      'Y-m-d'
				  .replace('Y', date.getFullYear())
				  .replace('m', date.getMonth()+1)
				  .replace('d', date.getDate())
			  ));
		} else {
		    cells[cells.length -
			  1].appendChild(document.createTextNode(history[key][i]));
		}
	    }
	}
	histDiv.appendChild(histTable);
    }

    function showCompHist(orderIdx, compIdx) {
	var history = orders[orderIdx - 1].components[compIdx - 1].history;
	
	console.log("Row " + compIdx + " clicked!");

	var histDiv = document.getElementById('componenthistory');
	if (document.getElementById('componenthistorytable') !== null) {
	    var histTable = document.getElementById('componenthistorytable')
	    histDiv.removeChild(histTable);
	}
	var histTable = document.createElement('table');
	histTable.id = 'componenthistorytable';

	histDiv.innerHTML = 'Component History';

	var topRow = histTable.insertRow();
	topRow.classList.add('toprow');
	var idCell = topRow.insertCell();
	idCell.innerHTML = 'Times';
	var compCell = topRow.insertCell();
	compCell.innerHTML = 'Resources';	
	var histCell = topRow.insertCell();
	histCell.innerHTML = 'Actions';
	
	for (var i in history.times) {
	    console.log(i);
	    console.log(history[i]);
	    var row = histTable.insertRow();
	    var cells = [];
	    for (var key in history) {
		cells.push(row.insertCell());
		// First array is the times given as UTC.
		if (key === 'times') {
		    var date = new Date(0);
		    date.setUTCSeconds(history[key][i]);
		    cells[cells.length -
			  1].appendChild(document.createTextNode(
			      'Y-m-d'
				  .replace('Y', date.getFullYear())
				  .replace('m', date.getMonth()+1)
				  .replace('d', date.getDate())
			  ));
		} else {
		    cells[cells.length -
			  1].appendChild(document.createTextNode(history[key][i]));
		}
	    }
	}
	histDiv.appendChild(histTable);
    }
    
    var orderDiv = document.getElementById('orderlist');
    // If new orders are requested we clean up the old by
    // completly removing the old tables. 
    if (document.getElementById('ordertable') !== null) {
	var orderTable = document.getElementById('ordertable');
	orderDiv.removeChild(orderTable);
    }
    if (document.getElementById('componenttable') !== null) {
	var compTable = document.getElementById('componenttable');
	compTable.parentNode.removeChild(compTable);
    }
    if (document.getElementById('orderhistorytable') !== null) {
	var histTable = document.getElementById('orderhistorytable')
	histTable.parentNode.removeChild(histTable);
    }
    if (document.getElementById('componenthistorytable') !== null) {
	var histTable = document.getElementById('componenthistorytable')
	histTable.parentNode.removeChild(histTable);
    }
    var orderTable = document.createElement('table');
    orderTable.id = 'ordertable';

    orderDiv.innerHTML = 'Orders';
    
    var topRow = orderTable.insertRow();
    topRow.classList.add('toprow');
    var idCell = topRow.insertCell();
    idCell.innerHTML = 'ID';
    var ctCell = topRow.insertCell();
    ctCell.innerHTML = 'Cycle Time';
    var compCell = topRow.insertCell();
    compCell.innerHTML = 'Components';	
    var histCell = topRow.insertCell();
    histCell.innerHTML = 'History';
    
    for (var i in orders) {
	console.log(response.orders[i]);
	var row = orderTable.insertRow();
	row.addEventListener('click', function() {
	    showComps(this.rowIndex);
	    showOrderHist(this.rowIndex);
	});
	var cells = [];
	
	for (var key in orders[i]) {
	    cells.push(row.insertCell());
	    if (!(Array.isArray(orders[i][key]))) { 
		cells[cells.length -
		      1].appendChild(document.createTextNode(orders[i][key]));
	    } else {
		cells[cells.length -
		      1].appendChild(document.createTextNode(orders[i][key].length));
	    }
	}
	
    }
    
    orderDiv.appendChild(orderTable);
}
