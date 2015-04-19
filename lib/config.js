var inherit = require('inherit'),
    _ = require('lodash');

/**
 * @name Config
 * @class
 */
module.exports = inherit({
    /**
     * Constructor
     * @param {Object} configFile
     * @param {Object} configFile.github
     * @param {Object} configFile.github.options
     * @param {String} configFile.github.token
     * @param {Object} configFile.npm
     * @param {String} configFile.npm.registry
     * @param {String[]} configFile.references
     * @param {Object} opts
     * @param {String[]} opts.update
     * @param {String[]} opts.exclude
     * @param {String[]} opts.force
     * @param {Boolean} opts.silent
     * @param {Boolean} opts.dryMode
     */
    __constructor: function (configFile, opts) {
        this.github = configFile.github;
        this.npm = configFile.npm;

        this._refs = configFile.references;
        this._depsTypes = _.flatten(opts.update);

        this._exclude = opts.exclude;
        this._forceUpdates = this._parseForceUpdates(opts.force || []);

        this.silent = opts.silent;
        this.dryMode = opts.dryMode;
    },

    /**
     * @typedef {Object} Reference
     * @property {String} owner
     * @property {String} name
     * @property {String} branch
     */

    /**
     * @returns {Reference[]}
     * @public
     */
    getRefs: function () {
        return this._refs.map(function (ref) {
            var match = ref.match(/(.*)\/(.*)#(.*)/);

            return {
                owner: match[1],
                name: match[2],
                branch: match[3]
            };
        });
    },

    /**
     * @typedef {Object} Dependency
     * @property {String} name
     * @property {String} version
     * @property {String} updatedVersion
     * @property {String} type
     */

    /**
     * @param {Object} packageJSON
     * @returns {Dependency[]}
     * @public
     */
    getDeps: function (packageJSON) {
        return _(packageJSON)
            .pick('dependencies', 'devDependencies')
            .map(this._parseDeps.bind(this))
            .flatten()
            .compact()
            .value();
    },

    /**
     * @param {Object} deps
     * @param {String} type
     * @returns {Dependency}
     * @private
     */
    _parseDeps: function (deps, type) {
        return _.map(deps, function (version, name) {
            if (_.contains(this._depsTypes, type)) {
                return { name: name, version: version, type: type };
            }
        }.bind(this));
    },

    /**
     * @param {String[]} deps
     * @returns {Object[]}
     * private
     */
    _parseForceUpdates: function (deps) {
        return deps.map(function (dep) {
            var match = dep.match('(.*)@(.*)');

            return {
                name: match[1],
                version: match[2]
            };
        });
    },

    /**
     * @param {Dependency} dep
     * @returns {Boolean}
     * @public
     */
    isExcludingDep: function (dep) {
        return _.contains(this._exclude, dep.name);
    },

    /**
     * @param {Dependency} dep
     * @returns {String|undefined}
     * @public
     */
    getForceUpdate: function (dep) {
        return _.result(_.find(this._forceUpdates, function (forceUpdate) {
            return forceUpdate.name === dep.name;
        }), 'version');
    }
});
