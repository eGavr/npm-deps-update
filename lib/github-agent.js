var GithubApi = require('github'),
    inherit = require('inherit'),
    Q = require('q');

/**
 * @name GithubAgent
 * @class
 */
module.exports = inherit({
    /**
     * Constructor
     * @param {Object} opts
     * @param {Object} opts.options
     * @param {String} opts.token
     */
    __constructor: function (opts) {
        this.github = new GithubApi(opts.options);
        this.github.authenticate({
            type: 'oauth',
            token: opts.token
        });
    },

    /**
     * @typedef {Object} Reference
     * @property {String} owner
     * @property {String} name
     * @property {String} branch
     */

    /**
     * @param {Reference} ref
     * @returns {String}
     * @public
     */
    getFileContent: function (ref, filepath) {
        return this._getFile(ref, filepath)
            .then(function (res) {
                return new Buffer(res.content, 'base64').toString('utf8');
            });
    },

    /**
     * @param {Reference} ref
     * @param {String} filepath
     * @returns {String}
     * @public
     */
    getFileSha: function (ref, filepath) {
        return this._getFile(ref, filepath)
            .then(function (res) {
                return res.sha;
            });
    },

    /**
     * @param {Reference} ref
     * @param {String} filepath
     * @returns {String}
     * @private
     */
    _getFile: function (ref, filepath) {
        return Q.nfcall(this.github.repos.getContent, {
            user: ref.owner,
            repo: ref.name,
            path: filepath,
            ref: ref.branch
        });
    },

    /**
     * @param {Reference} ref
     * @param {String} branchName
     * @returns {Object} response from github
     * @public
     */
    createBranch: function (ref, branchName) {
        return this._getLatestCommitSha(ref)
            .then(function (latestCommitSha) {
                return Q.nfcall(this.github.gitdata.createReference, {
                    user: ref.owner,
                    repo: ref.name,
                    ref: 'refs/heads/' + branchName,
                    sha: latestCommitSha
                });
            }.bind(this));
    },

    /**
     * @param {Reference} ref
     * @returns {String}
     * @private
     */
    _getLatestCommitSha: function (ref) {
        return Q.nfcall(this.github.repos.getCommits, {
            user: ref.owner,
            repo: ref.name,
            sha: ref.branch,
            per_page: 1 // jscs:disable
        })
        .then(function (res) {
            return res[0].sha;
        });
    },

    /**
     * @param {Reference} ref
     * @param {String} filepath
     * @param {String} content
     * @param {String} sha
     * @returns {Object} response from github
     * @public
     */
    updateFile: function (ref, filepath, content, sha) {
        return Q.nfcall(this.github.repos.updateFile, {
            user: ref.owner,
            repo: ref.name,
            path: filepath,
            message: 'Update deps',
            content: new Buffer(JSON.stringify(content, null, '  ') + '\n').toString('Base64'),
            sha: sha,
            branch: ref.branch
        });
    },

    /**
     * @param {Reference} ref
     * @param {String} branchName
     * @returns {Object} response from github
     * @public
     */
    createPullRequest: function (ref, branchName) {
        return Q.nfcall(this.github.pullRequests.create, {
            user: ref.owner,
            repo: ref.name,
            title: 'Update dependencies',
            base: ref.branch,
            head: branchName
        });
    }
});
