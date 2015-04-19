var chalk = require('chalk'),
    Table = require('cli-table'),
    tableOptions = {
        head: ['package', 'current version', 'updated version'],
        style: { head: ['blue', 'bold'] }
    };

/**
 * Reports results in a table format
 * @param {Object} refs
 * @returns {undefined}
 */
exports.write = function (refs) {
    Object.keys(refs).forEach(function (ref) {
        console.log(chalk.bold.green('\n' + ref));

        var depsTypes = refs[ref];
        Object.keys(depsTypes).forEach(function (type) {
            console.log(chalk.yellow(type));

            var deps = depsTypes[type],
                table = new Table(tableOptions);

            deps.forEach(function (dep) {
                table.push([
                    dep.name,
                    dep.version,
                    dep.updatedVersion && dep.version !== dep.updatedVersion ? dep.updatedVersion : '',
                ]);
            });

            console.log(table.toString());
        });
    });
};
