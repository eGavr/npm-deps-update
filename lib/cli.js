var fs = require('fs'),
    path = require('path'),
    npmVersions = require('./'),
    Config = require('./config'),
    reporter = require('./reporter');

/**
 * CLI
 */
module.exports = require('coa').Cmd()
    .name(process.argv[1])
    .helpful()
    .title('NPM deps update')
    .opt()
        .name('version')
        .title('Shows the version number')
        /*jshint -W024 */
        .short('v').long('version')
        .flag()
        .only()
        .act(function () {
            var p = require('../package.json');
            return p.name + ' ' + p.version;
        })
        .end()
    .opt()
        .name('config')
        .title('Path to the configuration file')
        .long('config').short('c')
        .req()
        .end()
    .opt()
        .name('update')
        .title('dependencies or devDependencies')
        .long('update').short('u')
        .arr()
        .def(['dependencies', 'devDependencies'])
        .end()
    .opt()
        .name('exclude')
        .title('Exclude a dependency')
        .long('exclude').short('e')
        .arr()
        .end()
    .opt()
        .name('force')
        .title('Force update of a dependency')
        .long('force').short('f')
        .arr()
        .end()
    .opt()
        .name('silent')
        .title('Do not output the results')
        .long('silent').short('s')
        .flag()
        .end()
    .opt()
        .name('dryMode')
        .title('Dry mode (no branches and pull requests)')
        .long('dry-mode')
        .flag()
        .end()
    .act(function (opts) {
        var configFile = JSON.parse(fs.readFileSync(path.resolve(opts.config), 'utf-8')),
            config = new Config(configFile, opts);

        return npmVersions.update(config)
            .then(function (updatedRefs) {
                if (!config.silent) {
                    reporter.write(updatedRefs);
                }
            })
            .fail(function (err) {
                throw err;
            });
    })
    .run(process.argv.slice(2));
