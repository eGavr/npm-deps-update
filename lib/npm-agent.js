var inherit = require('inherit'),
    _ = require('lodash'),
    npm = require('npm'),
    Q = require('q');

/**
 * @name NpmAgent
 * @class
 */
module.exports = inherit({
    /**
     * Constructor
     */
    __constructor: function () {
        this._initialized = false;
    },

    /**
     * @param {Object} opts
     * @param {String} opts.registry
     * @returns {undefined}
     */
    initialize: function (opts) {
        return Q.nfcall(npm.load, { silent: true, registry: opts.registry })
            .then(function () {
                this._initialized = true;
            }.bind(this));
    },

    /**
     * @param {String} packageName
     * @param {String} field
     * @returns {String[]}
     */
    view: function (packageName, field) {
        if (!this._initialized) {
            throw new Error('initialize must be called before using the version manager');
        }

        return Q.nfcall(npm.commands.view, [packageName, field], true)
            .then(function (res) {
                return _.values(res)[0][field];
            });
    }

});
