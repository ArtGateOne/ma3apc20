//ma3apc20 v 1.1 by ArtGateOne

var easymidi = require('easymidi');
var osc = require("osc")

//config
midi_in = 'Akai APC20';     //set correct midi in device name
midi_out = 'Akai APC20';    //set correct midi out device name
localip = "127.0.0.1";
localport = 8001;   //recive port from ma3
remoteip = "127.0.0.1";
remoteport = 8000;  //send port to ma3




var page = 1;
var str = "string";
var fader = 201;
var key = 100;
var detection = 1;
var selectedencoder = 0;
var encTime = process.hrtime();
const NS_PER_SEC = 1e9;

var index = new Array(410);
var faderValue = [0, 0, 0, 0, 0.2, 0.6, 1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.8, 4.2, 4.6, 5, 5.3, 5.7, 6.1, 6.5, 6.9, 7.3, 7.7, 8.1, 8.5, 8.9, 9.3, 9.7, 10, 10.4, 10.8, 11.2, 11.6, 12, 12.4, 12.8, 13.2, 13.6, 14, 14.15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 100, 100];
var midi = new Array(410)


for (var i = 0; i <= 8; i++) {// execnr[midi note, midi channel, midi value/key, fader value]
  //midi[0] = [0, 0, 0, 0];
  midi[i + 101] = [51, i, 0, 0];
  midi[i + 201] = [52, i, 0, 0];
  midi[i + 301] = [56, i, 0, 0];
  midi[i + 401] = [54, i, 0, 0];
}



//MIDI
//display info
console.log("Akai APC 20 MA3 OSC");
console.log(" ");

//display all midi devices
console.log("Midi IN");
console.log(easymidi.getInputs());
console.log("Midi OUT");
console.log(easymidi.getOutputs());

console.log(" ");

console.log("Connecting to midi device: " + midi_in);

//open midi device
var output = new easymidi.Output(midi_out);
output.send('sysex', [0xF0, 0x47, 0x7F, 0x7B, 0x60, 0x00, 0x04, 0x42, 0x08, 0x02, 0x01, 0xF7]); //APC20 mode2
output.close();

var input = new easymidi.Input(midi_in);
var output = new easymidi.Output(midi_out);

//sleep 1000
sleep(1000, function () {
  // executes after one second, and blocks the thread
});

midiclear();

// Create an osc.js UDP Port listening on port 8000.
var udpPort = new osc.UDPPort({
  localAddress: localip,
  localPort: localport,
  metadata: true
});

// Listen for incoming OSC messages.
udpPort.on("message", function (oscMsg, timeTag, info) {
  //console.log("An OSC message just arrived!", oscMsg);
  //console.log("Remote info is: ", info);

  //console.log(oscMsg.args[0].value);

  if (detection == 1) {
    index[key] = oscMsg.address;
    console.log(key + " " + oscMsg.address);

  } else {//recive osc - send midi 
    if (index.indexOf(oscMsg.address) >= 0) {
      if ((oscMsg.args[0].value) == "On" || (oscMsg.args[0].value) == "Go+" || (oscMsg.args[0].value) == "Go-") {
        output.send('noteon', { note: (midi[index.indexOf(oscMsg.address)][0]), velocity: 1, channel: (midi[index.indexOf(oscMsg.address)][1]) });
      }

      else if ((oscMsg.args[0].value) == "Off") {
        output.send('noteon', { note: (midi[index.indexOf(oscMsg.address)][0]), velocity: 0, channel: (midi[index.indexOf(oscMsg.address)][1]) });
      }

      else if ((oscMsg.args[0].value) == "Swop" || (oscMsg.args[0].value) == "Flash") {
        output.send('noteon', { note: (midi[index.indexOf(oscMsg.address)][0]), velocity: (oscMsg.args[1].value), channel: (midi[index.indexOf(oscMsg.address)][1]) });
      }

      else if ((oscMsg.args[0].value) == "FaderMaster") {
        if (index.indexOf(oscMsg.address) > 0) {
          if (oscMsg.args[2].value > 0) {
            output.send('noteon', { note: (midi[index.indexOf(oscMsg.address)][0]), velocity: 1, channel: (midi[index.indexOf(oscMsg.address)][1]) });
          } else {
            output.send('noteon', { note: (midi[index.indexOf(oscMsg.address)][0]), velocity: 0, channel: (midi[index.indexOf(oscMsg.address)][1]) });
          }
          //midi[index.indexOf(oscMsg.address)][3] = oscMsg.args[2].value; //save recived fader/encoder value to array (loop problem :())
        }
      }
    }
  }
});

// Open the socket.
udpPort.open();




// When the port is read, send an OSC message to, say, SuperCollider
udpPort.on("ready", function () {

  console.log("START DETECTION");
  setInterval(detect, 200);//80
});


input.on('cc', function (msg) {

  if (msg.controller == 7) {//faders 1-8
    //create address string      
    str = "/Page" + page + "/Fader" + (msg.channel + fader);

    //send OSC
    udpPort.send({
      address: str,
      args: [
        {
          type: "i",
          value: (faderValue[msg.value])
        }
      ]
    }, remoteip, remoteport);
  }

  if (msg.controller == 14) {//GrandMaster

    udpPort.send({
      address: "/cmd",
      args: [
        {
          type: "s",
          value: "Master 2.1 At " + (faderValue[msg.value])
        }
      ]
    }, remoteip, remoteport);
    /*udpPort.send({
    address: "/13.12.2.1",
      args: [
        {
          type: "s",
          value: "FaderMaster"
        },
        {
          type: "i",
          value: 1
        },
        {
          type: "f",
          value: faderValue[msg.value]
        }
      ]
    }, remoteip, remoteport);*/
  }

  if (msg.controller == 47) {//encoder

    var efvalue = 0.0;
    if (selectedencoder > 0) {
      diff = process.hrtime(encTime);
      if ((diff[0] * NS_PER_SEC + diff[1]) >= 50000000) {
        if (msg.value > 64) {
          efvalue = (-127 + msg.value)
        } else {
          efvalue = (msg.value)
        }



        efvalue = midi[selectedencoder][3] + efvalue;

        if (efvalue < 0) { efvalue = 0 };
        if (efvalue > 100) { efvalue = 100 };

        midi[selectedencoder][3] = efvalue;

        udpPort.send({
          address: "/Page1/Fader" + selectedencoder,
          args: [
            {
              type: "i",
              value: efvalue
            }
          ]
        }, remoteip, remoteport);
      }
    }
  }


});


input.on('noteon', function (msg) {


  if (msg.note == 53) {//encoder select 401-408
    if (selectedencoder == 0) {
      selectedencoder = (msg.channel + 401);
      output.send('noteon', { note: msg.note, velocity: 3, channel: msg.channel });
    } else if (selectedencoder == (msg.channel + 401)) {
      selectedencoder = 0;
      output.send('noteon', { note: msg.note, velocity: 5, channel: msg.channel });
    } else {
      if (selectedencoder > 300) {
        output.send('noteon', { note: ((midi[selectedencoder][0]) - 1), velocity: 5, channel: (midi[selectedencoder][1]) });
      } else {
        output.send('noteon', { note: ((midi[selectedencoder][0]) + 5), velocity: 5, channel: (midi[selectedencoder][1]) });
      }
      selectedencoder = (msg.channel + 401);
      output.send('noteon', { note: msg.note, velocity: 3, channel: msg.channel });
    }
  }
  if (msg.note == 54) {//executors 401-408 ON
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 401),
      args: [

        {
          type: "i",
          value: 1
        }
      ]
    }, remoteip, remoteport);
  }
  if (msg.note == 55) {//encoder select 301-308
    if (selectedencoder == 0) {
      selectedencoder = (msg.channel + 301);
      output.send('noteon', { note: msg.note, velocity: 3, channel: msg.channel });
    } else if (selectedencoder == (msg.channel + 301)) {
      selectedencoder = 0;
      output.send('noteon', { note: msg.note, velocity: 5, channel: msg.channel });
    } else {
      if (selectedencoder > 300) {
        output.send('noteon', { note: ((midi[selectedencoder][0]) - 1), velocity: 5, channel: (midi[selectedencoder][1]) });
      } else {
        output.send('noteon', { note: ((midi[selectedencoder][0]) + 5), velocity: 5, channel: (midi[selectedencoder][1]) });
      }
      selectedencoder = (msg.channel + 301);
      output.send('noteon', { note: msg.note, velocity: 3, channel: msg.channel });
    }
  }
  if (msg.note == 56) {//executors 301-308 ON
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 301),
      args: [

        {
          type: "i",
          value: 1
        }
      ]
    }, remoteip, remoteport);
  }
  if (msg.note == 57) {//encoder select 201-208
    if (selectedencoder == 0) {
      selectedencoder = (msg.channel + 201);
      output.send('noteon', { note: msg.note, velocity: 3, channel: msg.channel });
    } else if (selectedencoder == (msg.channel + 201)) {
      selectedencoder = 0;
      output.send('noteon', { note: msg.note, velocity: 5, channel: msg.channel });
    } else {
      if (selectedencoder > 300) {
        output.send('noteon', { note: ((midi[selectedencoder][0]) - 1), velocity: 5, channel: (midi[selectedencoder][1]) });
      } else {
        output.send('noteon', { note: ((midi[selectedencoder][0]) + 5), velocity: 5, channel: (midi[selectedencoder][1]) });
      }
      selectedencoder = (msg.channel + 201);
      output.send('noteon', { note: msg.note, velocity: 3, channel: msg.channel });
    }
  }

  if (msg.note == 52) {//executors 201-208 ON
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 201),
      args: [

        {
          type: "i",
          value: 1
        }
      ]
    }, remoteip, remoteport);
  }

  if (msg.note == 51) {//executors 101-108
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 101),
      args: [

        {
          type: "i",
          value: 1
        }
      ]
    }, remoteip, remoteport);
  }

  if (msg.note == 50) {
    udpPort.send({
      address: "/cmd",
      args: [
        {
          type: "s",
          value: "Go- Exec " + (msg.channel + 201)
        }
      ]
    }, remoteip, remoteport);

  }

  if (msg.note == 49) {//GO+
    udpPort.send({
      address: "/cmd",
      args: [
        {
          type: "s",
          value: "Go+ Exec " + (msg.channel + 201)
        }
      ]
    }, remoteip, remoteport);


  }

  if (msg.note == 48) {//FLASH
    udpPort.send({
      address: "/cmd",
      args: [
        {
          type: "s",
          value: "Flash Exec " + (msg.channel + 201)
        }
      ]
    }, remoteip, remoteport);
  }
});



input.on('noteoff', function (msg) {

  if (msg.note == 53) { }

  if (msg.note == 54) {//executors 401-408 OFF
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 401),
      args: [

        {
          type: "i",
          value: 0
        }
      ]
    }, remoteip, remoteport);
  }

  if (msg.note == 55) { }

  if (msg.note == 56) {//executors 301-308 OFF
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 301),
      args: [

        {
          type: "i",
          value: 0
        }
      ]
    }, remoteip, remoteport);
  }

  if (msg.note == 57) { }


  if (msg.note == 52) {//executors 201-208
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 201),
      args: [

        {
          type: "i",
          value: 0
        }
      ]
    }, remoteip, remoteport);
  }

  if (msg.note == 51) {//executors 101-108
    udpPort.send({
      address: "/Page1/Key" + (msg.channel + 101),
      args: [

        {
          type: "i",
          value: 0
        }
      ]
    }, remoteip, remoteport);
  }

  if (msg.note == 50) {

  }

  if (msg.note == 49) {

  }

  if (msg.note == 48) {
    udpPort.send({
      address: "/cmd",
      args: [
        {
          type: "s",
          value: "Flash Off Exec " + (msg.channel + 201)
        }
      ]
    }, remoteip, remoteport);
  }
});




//sleep function
function sleep(time, callback) {
  var stop = new Date()
    .getTime();
  while (new Date()
    .getTime() < stop + time) {
    ;
  }
  callback();
}


//midi clear function
function midiclear() {
  for (i = 0; i < 90; i++) {
    output.send('noteon', { note: i, velocity: 0, channel: 0 });
    //sleep(10, function () { });
  }
  for (i = 0; i <= 7; i++) {
    output.send('noteon', { note: 48, velocity: 1, channel: i });
    output.send('noteon', { note: 49, velocity: 1, channel: i });
    output.send('noteon', { note: 50, velocity: 1, channel: i });
    output.send('noteon', { note: 51, velocity: 0, channel: i });
    output.send('noteon', { note: 52, velocity: 0, channel: i });
    output.send('noteon', { note: 53, velocity: 5, channel: i });
    output.send('noteon', { note: 54, velocity: 0, channel: i });
    output.send('noteon', { note: 55, velocity: 5, channel: i });
    output.send('noteon', { note: 56, velocity: 0, channel: i });
    output.send('noteon', { note: 57, velocity: 5, channel: i });
  }

  return;
}


function detect() {
  if (detection == 1) {//detection loop

    if (key <= 407) {

      key++;

      if (key == 109 || key == 209 || key == 309) {
        key = key + 92;
      }

      udpPort.send({
        address: "/Page1/Fader" + key,
        args: [
          {
            type: "i",
            value: 0
          }
        ]
      }, remoteip, remoteport);


    } else {
      detection = 0;
      setInterval(detect, 0);
      udpPort.send({
        address: "/cmd",
        args: [
          {
            type: "s",
            value: "Off Sequence Thru"
          }
        ]
      }, remoteip, remoteport);


      console.log("READY.");
    }
  }
  return;
}