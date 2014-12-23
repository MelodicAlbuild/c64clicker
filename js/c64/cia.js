define(function() {
    return {
        JOY_UP: 1,
        JOY_DOWN: 2,
        JOY_LEFT: 4,
        JOY_RIGHT: 8,
        JOY_FIRE: 16,

        timers: [],
        CNTPIN: null,
        CNTPIN_prev: null,

        IRQ: null,
        IRM: null,

        currJoyPort: null,
        currJoyState: null,

        registers: [
            // CIA1: peripherals/IRQ
            [
                0, // Port A
                0, // Port B
                0, // Port A direction
                0, // Port B direction
                0, // Timer A low byte
                0, // Timer A high byte
                0, // Timer B low byte
                0, // Timer B high byte
                0, // RTC tenth-of-sec
                0, // RTC sec
                0, // RTC min
                0, // RTC hour
                0, // Shift register
                0, // IRQ source
                0, // Timer A control
                0  // Timer B control
            ],

            // CIA2: RS232/NMI
            [
                0, // Port A
                0, // Port B
                0, // Port A direction
                0, // Port B direction
                0, // Timer A low byte
                0, // Timer A high byte
                0, // Timer B low byte
                0, // Timer B high byte
                0, // RTC tenth-of-sec
                0, // RTC sec
                0, // RTC min
                0, // RTC hour
                0, // Shift register
                0, // NMI source
                0, // Timer A control
                0  // Timer B control
            ]
        ],

        io_r: function(addr) {
            var chip = (addr & 0x0100) ? 1 : 0;
            addr &= 0x0F;
            switch (addr) {
                case 0: // Port A
                    if (chip) {
                        // TODO: Keyboard read
                    } else {
                        if (this.currJoyPort == addr) {
                            this.registers[chip][addr] &= 0xE0;
                            this.registers[chip][addr] |= this.currJoyState;
                        }
                    }
                    break;
                case 1: // Port B
                    if (chip) {
                        // TODO: Keyboard read
                    } else {
                        if (this.currJoyPort == addr) {
                            this.registers[chip][addr] &= 0xE0;
                            this.registers[chip][addr] |= this.currJoyState;
                        }
                    }
                    break;
                case 4: // Timer A lo
                    this.registers[chip][addr] = this.timers[chip][0].value & 255;
                    break;
                case 5: // Timer A hi
                    this.registers[chip][addr] = this.timers[chip][0].value >> 8;
                    break;
                case 7: // Timer B lo
                    this.registers[chip][addr] = this.timers[chip][1].value & 255;
                    break;
                case 8: // Timer B hi
                    this.registers[chip][addr] = this.timers[chip][1].value >> 8;
                    break;
                case 13: // IRQ
                    this.registers[chip][addr] = this.IRQ[chip];
                    this.IRQ[chip] = 0;
                    break;
            }
            return this.registers[chip][addr];
        },
        io_w: function(addr, val) {
            var chip = (addr & 0x0100) ? 1 : 0;
            addr &= 0x0F;
            val &= 255;

            switch (addr) {
                case 4: // Timer A lo latch
                    this.timers[chip][0].latch &= 0xFF00;
                    this.timers[chip][0].latch |= val;
                    return;
                case 5: // Timer A hi latch
                    this.timers[chip][0].latch &= 0x00FF
                    this.timers[chip][0].latch |= (val << 8);
                    return;
                case 6: // Timer B lo latch
                    this.timers[chip][1].latch &= 0xFF00;
                    this.timers[chip][1].latch |= val;
                    return;
                case 7: // Timer B hi latch
                    this.timers[chip][1].latch &= 0x00FF
                    this.timers[chip][1].latch |= (val << 8);
                    return;
                case 13: // IRM
                    if (val & 31) {
                        this.IRM[chip] = (val & 31) ^ ((val & 128) ? 0 : 31);
                    }
                    break;
                case 14: // Timer A control
                    this.timers[chip][0].running = !!(val & 1);
                    this.timers[chip][0].oneshot = !!(val & 8);
                    this.timers[chip][0].latchroll = !!(val & 16);
                    this.timers[chip][0].mode = (val & 32) >> 5;
                    if (!this.timers[chip][0].running) {
                        this.timers[chip][0].latch &= 255;
                    }
                    break;
                case 15: // Timer B control
                    this.timers[chip][1].running = !!(val & 1);
                    this.timers[chip][1].oneshot = !!(val & 8);
                    this.timers[chip][1].latchroll = !!(val & 16);
                    this.timers[chip][1].mode = (val & 96) >> 5;
                    if (!this.timers[chip][1].running) {
                        this.timers[chip][1].latch &= 255;
                    }
                    break;
            }

            this.registers[chip][addr] = val & 255;
        },
        handlers: {
            keydown: function(e) {
                switch (e.keyCode) {
                    case 37:
                        $('#joy_left').addClass('active');
                        this.currJoyState &= (255 - this.JOY_LEFT);
                        break;
                    case 38:
                        $('#joy_up').addClass('active');
                        this.currJoyState &= (255 - this.JOY_UP);
                        break;
                    case 39:
                        $('#joy_right').addClass('active');
                        this.currJoyState &= (255 - this.JOY_RIGHT);
                        break;
                    case 40:
                        $('#joy_down').addClass('active');
                        this.currJoyState &= (255 - this.JOY_DOWN);
                        break;
                    case 32:
                        $('#joy_fire').addClass('active');
                        this.currJoyState &= (255 - this.JOY_FIRE);
                        break;
                }
            },
            keyup: function(e) {
                switch (e.keyCode) {
                    case 37:
                        $('#joy_left').removeClass('active');
                        this.currJoyState |= this.JOY_LEFT;
                        break;
                    case 38:
                        $('#joy_up').removeClass('active');
                        this.currJoyState |= this.JOY_UP;
                        break;
                    case 39:
                        $('#joy_right').removeClass('active');
                        this.currJoyState |= this.JOY_RIGHT;
                        break;
                    case 40:
                        $('#joy_down').removeClass('active');
                        this.currJoyState |= this.JOY_DOWN;
                        break;
                    case 32:
                        $('#joy_fire').removeClass('active');
                        this.currJoyState |= this.JOY_FIRE;
                        break;
                }
            }
        },
        getState: function() {
            var t = [], i, j;
            for (i = 0; i < 2; i++) {
                t[i] = [];
                for (j = 0; j < 2; j++) {
                    t[i][j] = $.extend({}, this.timers[i][j])
                }
            }
            return {
                CIA1: this.registers[0].slice(0),
                CIA2: this.registers[1].slice(0),
                timers: t
            }
        },
        setState: function(state) {
            var t = [], i, j;
            for (i = 0; i < 2; i++) {
                t[i] = [];
                for (j = 0; j < 2; j++) {
                    t[i][j] = $.extend({}, state.timers[i][j])
                }
            }
            for (i in state.CIA1) {
                this.io_w(i, state.CIA1[i]);
            }
            for (i in state.CIA2) {
                this.io_w(0x0100 + i, state.CIA2[i]);
            }
            this.registers[0][this.currJoyPort] &= 0xE0;
            this.registers[0][this.currJoyPort] |= this.currJoyState;
            this.timers = t;
        },
        step: function() {
            this.CNTPIN_prev = this.CNTPIN;

            var i, j, timer, dec;
            for (i = 0; i < 2; i++) {
                for (j = 0; j < 2; j++) {
                    timer = this.timers[i][j];
                    if (timer.running) {
                        if (timer.value == 0) {
                            timer.underflowed = true;
                            if (timer.oneshot) {
                                timer.running = false;
                            } else {
                                timer.value = timer.latchroll ? timer.latch : 65535;
                            }
                            if (j) {
                                if (this.IRM[i] & 2) {
                                    this.IRQ[i] |= 0x82;
                                    this.owner.CPU.signal('INT');
                                }
                            } else {
                                if (this.IRM[i] & 1) {
                                    this.IRQ[i] |= 0x81;
                                    this.owner.CPU.signal('INT');
                                }
                            }
                        } else {
                            timer.underflowed = false;
                            switch (j * 4 + timer.mode) {
                                // Timer A: clock
                                case 0:
                                    dec = true;
                                    break;
                                // Timer A: positive slope on CNT
                                case 1:
                                    dec = this.CNTPIN && !this.CNTPIN_prev;
                                    break;

                                // Timer B: clock
                                case 4:
                                    dec = true;
                                    break;
                                // Timer B: positive slope on CNT
                                case 5:
                                    dec = this.CNTPIN && !this.CNTPIN_prev;
                                    break;
                                // Timer B: A underflow
                                case 6:
                                    dec = this.timers[i][0].underflowed;
                                    break;
                                // Timer B: A underflow and +ve slope on CNT
                                case 7:
                                    dec = this.timers[i][0].underflowed && this.CNTPIN && !this.CNTPIN_prev;
                                    break;
                            }
                            if (dec) {
                                timer.value--;
                            }
                        }
                    }
                }
            }
        },
        reset: function() {
            // All pins are pulled high on the data ports
            this.registers[0][0] = 255;
            this.registers[0][1] = 255;
            this.registers[1][0] = 255;
            this.registers[1][1] = 255;

            this.currJoyPort = 0;
            this.currJoyState = 31;
            this.CNTPIN = false;
            this.CNTPIN_prev = false;
            this.IRQ = [0,0];
            this.IRM = [0,0];

            var i, j;
            this.timers.length = 0;
            for (i = 0; i < 2; i++) {
                this.timers[i] = [];
                for (j = 0; j < 2; j++) {
                    this.timers[i][j] = {
                        mode: 0,
                        running: false,
                        underflowed: false,
                        oneshot: false,
                        latchroll: false,
                        latch: 0,
                        value: 0
                    };
                }
            }
        },
        init: function() {
            this.reset();
            $(document)
                .on('keydown', this.handlers.keydown.bind(this))
                .on('keyup', this.handlers.keyup.bind(this));
        }
    };
});
