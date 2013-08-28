///////////////
// Variables //
///////////////
//var url = "http://192.168.0.33:1000"  //LOCAL
var url = "http://livecode.aws.af.cm:80"  //DEPLOYED
var isPresenter = false;
var disName = "";
var numUsers;
var sessionName;
var roomCode;
var socket;
var refURL = window.location.protocol + "//" + window.location.host + window.location.pathname;

/////////////////////
// socket.io begin //
/////////////////////
function startSocket(){
	console.log("Connecting to the server...");

	delete io.sockets[url];io.j = [];
	socket = io.connect(url);

	//On "connect"
	socket.on("connect", function (data) {
		console.log("Connected to the server...");
		if(isPresenter){
			//Try to start the new room
			console.log("Trying to start the new room...");
			socket.emit("subscribe", {room: roomCode, presenter:isPresenter, name:sessionName, disName:disName});
		}
		else{
			//Try to join the given room
			socket.emit("subscribe", {room: roomCode, presenter:isPresenter, disName:disName});
		}
	});

	//On "joinedRoom" - Only recieved when user is "Presenter"
	socket.on("joinedRoom", function (data) {
		console.log("Joined room '" + roomCode + "' successfully...");
		sessionName = data.name;
		numUsers = data.users;
		$("#textArea").html(data.text);
		var roomURL = refURL + "?code=" + roomCode;
		$("#roomCode").html("Room Code: '" + roomCode + "' or <a href='" + roomURL + "'>" + roomURL + "</a>");
		$("#sessionName").text("Session Name: '" + sessionName + "'");
	});

	//On "failedRoom" - Only recieved when user is "Presenter"
	socket.on("failedRoom", function () {
		console.log("Failed to join room '" + roomCode + "' ...");
		socket.disconnect();
		$("#lightbox").lightbox_me({
		    centered: 	true,
		    closeClick: false,
		    closeEsc: 	false
		});
	});

	//On "startedRoom" - Only recieved when user is "Presenter"
	socket.on("startedRoom", function (data) {
		console.log("Started room '" + roomCode + "' successfully...");
		sessionName = data.name;
		numUsers = data.users;
		$("#textArea").html(data.text);
		var roomURL = refURL + "?code=" + roomCode;
		$("#roomCode").html("Room Code: '" + roomCode + "' or <a href='" + roomURL + "'>" + roomURL + "</a>");
		$("#sessionName").text("Session Name: '" + sessionName + "'");
	});

	//On "forceUpdate" - Only recieved when user is NOT "Presenter"
	socket.on("forceUpdate", function (data){
		//console.log("Recieved new data... (forceUpdate)");
		$("#textArea").html(data);
		reHighlight();
	});

	//On "newUser"
	socket.on("newUser", function (data){
		console.log("'" + data.disName + "' has joined the room...");
		console.log("There are " + data.users.length + " users in this room...");
	});

	//On "userLeft"
	socket.on("userLeft", function (data){
		console.log("'" + data.disName + "' has left the room...");
	});
}

function joinRoom () {
  	isPresenter = false;
	$("#lightbox").trigger("close");

	roomCode = $("#txtRoom").val();
	disName = $("#txtParName").val();
	console.log("joinRoom () :" + roomCode);

	startSocket();
}

function startRoom () {
	isPresenter = true;
	disName = $("#txtDisName").val();
	sessionName = $("#txtSesName").val();
	$("#textArea").attr("contenteditable","true");

	//Bind to the "keyup" function inside the editable div
	$("#textArea").bind("keyup",function(){
		socket.emit("updateServer", {room:roomCode,text:($("#textArea").html())});
	});

	//Generate a random room code
	roomCode = Math.random().toString(36).substring(2);

	$("#lightbox").trigger("close");

	startSocket();
}
///////////////////
// socket.io end //
///////////////////

/////////////////
// popup begin //
/////////////////
$(function() {
	console.log(window.location.protocol + "|" + window.location.host + "^" + window.location.pathname);
	//Get the room code from the URL if it is there
	var tempcode = getUrlVars()["code"];
	if(tempcode != undefined){
		//console.log("Code:" + tempcode);
		roomCode = tempcode;
		$("#txtRoom").val(roomCode);
	}

	//Display the popup
	$("#lightbox").lightbox_me({
	    centered: 	true,
	    closeClick: false,
	    closeEsc: 	false
	});
});
///////////////
// popup end //
///////////////

////////////////////////
// highlight.js begin //
////////////////////////
function reHighlight () {
	$("div#textArea").each(function(i, e) {hljs.highlightBlock(e)});
}
//////////////////////
// highlight.js end //
//////////////////////

////////////////////////////
// Helper functions begin //
////////////////////////////

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}


//////////////////////////
// Helper functions end //
//////////////////////////