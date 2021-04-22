const EventEmitter = require('events');

class StateMachine {

    // Set up state machine with transition graph & initial state
    constructor(machine) {
        this.machine = machine;
        this.emitter = new EventEmitter();
    }

    updateMachine(m) {

        this.machine = m;
    }

    getState() {
        console.log(this.machine.state);
    }

    emit(n) {
        let nextState = this.machine.transitions[this.machine.state][n];
        if(!nextState) throw new Error(`invalid: ${this.machine.state} -> ${n}`);

        this.machine.state = nextState;
        this.emitter.emit(n);
    }

    on(t, cb) {

        this.emitter.on(t, cb);
    }

}

module.exports = StateMachine;
