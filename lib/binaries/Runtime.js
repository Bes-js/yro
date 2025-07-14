
'use strict';

var commander = require('commander');

var YRO       = require('../..');
var Log       = require('../../lib/API/Log');
var cst       = require('../../constants.js');
var pkg       = require('../../package.json');
var path      = require('path');

var yro;

// Do not print banner
process.env.YRO_DISCRETE_MODE = true;

commander.version(pkg.version)
  .description('yro-runtime is an automatic pmx injection that runs in simulated no-daemon environment')
  .option('--auto-manage', 'keep application online after command exit')
  .option('--fast-boot', 'boot app faster by keeping YRO runtime online in background (effective at second exit/start)')
  .option('--web [port]', 'launch process web api on [port] default to 9615')
  .option('--secret [key]', 'YRO plus secret key')
  .option('--public [key]', 'YRO plus public key')
  .option('--machine-name [name]', 'YRO plus machine name')
  .option('--env [name]', 'select env_[name] env variables in process config file')
  .option('--watch', 'Watch and Restart')
  .option('-i --instances <number>', 'launch [number] instances with load-balancer')
  .usage('yro-runtime app.js');

commander.command('*')
  .action(function(cmd){
    YRO = new YRO.custom({
      YRO_home : path.join(process.env.HOME, '.pm3'),
      secret_key : cst.SECRET_KEY || commander.secret,
      public_key : cst.PUBLIC_KEY || commander.public,
      machine_name : cst.MACHINE_NAME || commander.machineName
    });

    YRO.connect(function() {
      if (commander.web) {
        var port = commander.web === true ? cst.WEB_PORT : commander.web;
        YRO.web(port);
      }

      YRO.start(cmd, commander, function(err, obj) {
        if (process.env.YRO_RUNTIME_DEBUG) {
          return YRO.disconnect(function() {});
        }

        if (err) {
          console.error(err);
          return process.exit(1);
        }

        var pm_id = obj[0].yro_env.pm_id;

        if (commander.instances == undefined) {
          return YRO.attach(pm_id, function() {
            exitYRO();
          });
        }

        if (commander.json === true)
          Log.jsonStream(YRO.Client, pm_id);
        else if (commander.format === true)
          Log.formatStream(YRO.Client, pm_id, false, 'YYYY-MM-DD-HH:mm:ssZZ');
        else
          Log.stream(YRO.Client, 'all', true);
      });
    });
  });

if (process.argv.length == 2) {
  commander.outputHelp();
  process.exit(1);
}

process.on('SIGINT', function() {
  exitYRO();
});

process.on('SIGTERM', function() {
  exitYRO();
});

commander.parse(process.argv);

function exitYRO() {
  console.log('Exited at %s', new Date());
  if (commander.autoManage)
    return process.exit(0);

  if (commander.fastBoot) {
    return YRO.delete('all', function() {
      process.exit(0);
    });
  }
  YRO.kill(function() {
    process.exit(0);
  });
}
