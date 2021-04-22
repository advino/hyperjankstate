let hypercore = require('hypercore');
let hyperswarm = require('hyperswarm');
const pump = require('pump');
let StateMachine = require('./State.js');

let feed = hypercore('./clone_storage', '86e3878749f77f755f20bcc965b364207cd0f70d3cfd6b31b857203a255979ed', {
    valueEncoding: 'json'
});

let sm = new StateMachine({});
let swarm = hyperswarm();

feed.ready(() => {

    console.log('Syncing @ ', feed.key.toString('hex'));

    if(feed.length > 0) {
        feed.head((err, data) => {
            if(err) throw Error("Error retrieving head from feed");
            sm.updateMachine(data);

            console.log("Current state");
            console.log("-------------");
            sm.getState();
        });
    }

    swarm.join(feed.discoveryKey, {lookup: true, announce: true});
    swarm.on('connection', (socket, detail) => {

        pump(socket, feed.replicate(true, {live: true}), socket);
    });
    
    feed.on('append', () => {
        feed.head((err, data) => {
            if(err) throw Error("Error retrieving head from feed");
            
            sm.updateMachine(data);
            sm.getState();
        });
    });
});

