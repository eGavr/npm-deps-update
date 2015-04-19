var _ = require('lodash'),
    NpmAgent = require('./npm-agent');

/**
 * @typedef {Object} Dependency
 * @property {String} name
 * @property {String} version
 * @property {String} updatedVersion
 * @property {String} type
 */

/**
 * @param {Dependency} dep
 * @param {Config} config
 * @returns {Dependency}
 */
module.exports = function (dep, config) {
    if (config.isExcludingDep(dep)) {
        return dep;
    }

    var forceUpdate = config.getForceUpdate(dep);
    if (forceUpdate) {
        dep.updatedVersion = forceUpdate;

        return dep;
    }

    var npmAgent = new NpmAgent();

    return npmAgent.initialize(config.npm)
        .then(function () {
            return npmAgent.view(dep.name, 'versions');
        })
        .then(function (versions) {
            dep.updatedVersion = findUpdates(dep, versions);

            return dep;
        });
};

/**
 * @param {Dependency} dep
 * @param {String[]} versions
 * @returns {String}
 */
function findUpdates(dep, versions) {
    if (!/^(\^|~){0,1}([0-9]+)\.([0-9]+)\.([0-9]+.*)$/.test(dep.version)) {
        return dep.version;
    }

    return _.findLast(versions, function (version) {
        return /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.test(version);
    });
}
