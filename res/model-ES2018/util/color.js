const color= {
    normal: '\x1b[39;49m',
    red: '\x1b[91m',
    yellow: '\x1b[93m',
    green: '\x1b[32m',

    logErr: function (text) {
        console.error(color.red + "ERR: " + color.normal + text)
    },

    greenOK: function() {
        console.log(color.green + "OK" + color.normal)
    }
}

module.exports = color