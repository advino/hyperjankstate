let hypercore = require('hypercore');
let hyperswarm = require('hyperswarm');
const pump = require('pump');
let StateMachine = require('./State.js');

let feed = hypercore('./feed_storage', {
    valueEncoding: 'json'
});

let m = {
    state: "default",
    transitions: {
        default: { click: "loading"},
        loading: { success: "active", fail: "error" },
        active: { exit: "default" },
        error: { exit: "default", click: "loading"}
    }
}

let swarm = hyperswarm();
let sm = new StateMachine(m);


process.stdin.on('data', data => {
    
    let d = data.toString().trim();

    sm.emit(d);
    feed.append(sm.machine);
});

// feed.createReadStream({live: true})
//     .on('data', data => {
//         console.log("Updating state:");
//         console.log("---------------");
//         console.log(data);
//         console.log("---------------");
//     });

feed.ready(() => {
    console.log("Seeding @ ", feed.key.toString('hex'));
    
    if(feed.length > 0) {
        feed.head((err, data) => {
            if(err) throw Error("Error in retrieving feed head");

            sm.updateMachine(data);
        });
    }    
    
    swarm.join(feed.discoveryKey, {lookup: true, announce: true});
    swarm.on('connection', (socket, details) => {

        pump(socket, feed.replicate(false, {live: true}), socket);
    });
});
