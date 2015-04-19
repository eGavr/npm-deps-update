var format = require('util').format,
    chalk = require('chalk'),
    _ = require('lodash'),
    Q = require('q'),
    GithubAgent = require('./github-agent'),
    updateDep = require('./update');

/**
 * @param {Config} config
 * @returns {Object}
 */
exports.update = function (config) {
    var refs = config.getRefs();

    return Q.all(refs.map(function (ref) {
            return handleDeps(ref, config);
        }))
        .then(zipDeps_);

    /**
     * @param {Dependency[]} handledDeps
     * @returns {Object}
     */
    function zipDeps_(handledDeps) {
        return _(refs)
            .map(function (ref) {
                return format('%s/%s#%s', ref.owner, ref.name, ref.branch);
            })
            .zipObject(handledDeps)
            .mapValues(function (deps) {
                return _.groupBy(deps, function (dep) {
                    return dep.type;
                });
            })
            .value();
    }
};

/**
 * @typedef {Object} Reference
 * @property {String} owner
 * @property {String} name
 * @property {String} branch
 */

/**
 * @param {Reference} ref
 * @param {Config} config
 */
function handleDeps(ref, config) {
    var githubAgent = new GithubAgent(config.github);

    return githubAgent.getFileContent(ref, 'package.json')
        .then(updateDeps_);

    /**
     * @typedef {Object} Dependency
     * @property {String} name
     * @property {String} version
     * @property {String} updatedVersion
     * @property {String} type
     */

    /**
     * @param {String} packageContent
     * @returns {Dependency[]}
     */
    function updateDeps_(packageContent) {
        var packageJSON = JSON.parse(packageContent),
            currentDeps = config.getDeps(packageJSON);

        return Q.all(currentDeps.map(function (dep) {
                return updateDep(dep, config);
            }))
            .then(function (updatedDeps) {
                if (config.dryMode) {
                    return updatedDeps;
                }

                var updatedPackageJSON = updatePackageJSON_(packageJSON, updatedDeps);
                if (_.isEqual(packageJSON, updatedPackageJSON)) {
                    return updatedDeps;
                }

                return sendPullRequest_(updatedPackageJSON)
                   .thenResolve(updatedDeps);
            });
    }

    /**
     * @param {Object} packageJSON
     * @param {Dependency[]} updatedDeps
     * @returns {Object}
     */
    function updatePackageJSON_(packageJSON, updatedDeps) {
        var updatedPackageJSON = _.clone(packageJSON, true);
        updatedDeps.forEach(function (dep) {
            updatedPackageJSON[dep.type][dep.name] = dep.updatedVersion || dep.version;
        });

        return updatedPackageJSON;
    }

    /**
     * @param {Object} updatedPackageJSON
     * @returns {udefined}
     */
    function sendPullRequest_(updatedPackageJSON) {
        var branchName = format('feature/update-deps@%s', ref.branch),
            fullname = format('%s/%s', ref.owner, ref.name),
            pullRef = {
                owner: ref.owner,
                name: ref.name,
                branch: branchName
            };

        return githubAgent.createBranch(ref, branchName)
            .then(function () {
                return githubAgent.getFileSha(pullRef, 'package.json');
            })
            .then(function (fileSha) {
                return githubAgent.updateFile(pullRef, 'package.json', updatedPackageJSON, fileSha);
            })
            .then(function () {
                return githubAgent.createPullRequest(ref, branchName);
            })
            .then(function () {
                console.log('%s: a pull request was sent from %s to %s',
                    chalk.bold(fullname),
                    chalk.yellow(branchName),
                    chalk.green(ref.branch)
                );
            })
            .fail(function (err) {
                if (err.code === 422) { // branch already exists
                    console.log('%s: branch %s already exists, skip', chalk.bold(fullname), chalk.red(branchName));
                    return;
                }

                throw err;
            });
    }
}
