var io = require("socket.io").listen(1000);
var rooms = {};

io.sockets.on("connection", function (socket) {

	//Subscriptions events
	socket.on("subscribe", function (data) {
		if(data.presenter){
			socket.join(data.room);
			rooms[data.room] = {users:[],text:"",name:data.name};
			if (data.disName == "") {
				data.disName = newNick();
			}
			rooms[data.room].users.push(data.disName);
			socket.set("nickname", data.disName);
			socket.emit("startedRoom", rooms[data.room]);
			console.log("Started Room: " + data.room);
		}
		else
		{
			var tempRoom = rooms[data.room];
			if ( tempRoom != undefined ) {
				socket.join(data.room);
				if (data.disName == "") {
					data.disName = newNick();
				}
				rooms[data.room].users.push(data.disName);
				console.log("Setting nickname: " + data.disName)
				socket.set("nickname", data.disName);
				socket.emit("joinedRoom", rooms[data.room]);
				socket.broadcast.to(data.room).emit("newUser", {disName:getNick(socket),users:rooms[data.room].users});
			}
			else{
				socket.emit("failedRoom");
				//console.log("Room: " + data.room + " not available...");
			}
		}
	});
	socket.on("unsubscribe", function (data) {
		socket.leave(data);
	});

	socket.on('disconnect', function() {
		var userRooms = io.sockets.manager.roomClients[socket.id];
		Object.keys(userRooms).forEach(function(key) {
			if(key.charAt(0) === '/'){
				key = key.slice(1);
				var index = rooms[key].users.indexOf(getNick(socket));
				if (index !== -1) {
				    rooms[key].users.splice(index, 1);
				}
				//THIS _____________________________________
				console.log("Was in: "+ key);
				//THIS _____________________________________
			}
		});
 		socket.broadcast.emit("userLeft", {disName:getNick(socket)});//socket.get("nickName")
        console.log(socket.id + ' disconnected');
        //remove user from db
    });

  	socket.on("updateServer", function (data){
  		//console.log("Room:" + data.room + " Text:" + data.text);
  		rooms[data.room].text = data.text;
  		socket.broadcast.to(data.room).emit("forceUpdate", rooms[data.room].text);
  	})
});

function newNick () {
	return (Math.random().toString(16).substring(2));
}

function getNick(tempSocket){
	var tempNick;
	tempSocket.get('nickname', function(err, nickname) {
        tempNick = nickname;
    });
    return tempNick;
}