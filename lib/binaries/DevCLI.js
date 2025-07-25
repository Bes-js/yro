
'use strict';

process.env.YRO_NO_INTERACTION = 'true';
// Do not print banner
process.env.YRO_DISCRETE_MODE = true;

var commander = require('commander');

var YRO       = require('../..');
var Log       = require('../API/Log');
var cst       = require('../../constants.js');
var pkg       = require('../../package.json');
var chalk     = require('ansis');
var path      = require('path');
var fmt       = require('../tools/fmt.js');
var exec      = require('child_process').exec;
var os        = require('os');

commander.version(pkg.version)
  .description('yro-dev monitor for any file changes and automatically restart it')
  .option('--raw', 'raw log output')
  .option('--timestamp', 'print timestamp')
  .option('--node-args <node_args>', 'space delimited arguments to pass to node in cluster mode - e.g. --node-args="--debug=7001 --trace-deprecation"')
  .option('--ignore [files]', 'files to ignore while watching')
  .option('--post-exec [cmd]', 'execute extra command after change detected')
  .option('--silent-exec', 'do not output result of post command', false)
  .option('--test-mode', 'debug mode for test suit')
  .option('--interpreter <interpreter>', 'the interpreter YRO should use for executing app (bash, python...)')
  .option('--env [name]', 'select env_[name] env variables in process config file')
  .option('--auto-exit', 'exit if all processes are errored/stopped or 0 apps launched')
  .usage('yro-dev app.js');

var YRO = new YRO.custom({
  YRO_home : path.join(os.homedir ? os.homedir() : (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE), '.yro-dev')
});

YRO.connect(function() {
  commander.parse(process.argv);
});

function postExecCmd(command, cb) {
  var exec_cmd = exec(command);

  if (commander.silentExec !== true) {
    exec_cmd.stdout.on('data', function(data) {
      process.stdout.write(data);
    });

    exec_cmd.stderr.on('data', function(data) {
      process.stderr.write(data);
    });
  }

  exec_cmd.on('close', function done() {
    if (cb) cb(null);
  });

  exec_cmd.on('error', function (err) {
    console.error(err.stack || err);
  });
};

function run(cmd, opts) {
  var timestamp = opts.timestamp;

  opts.watch = true;
  opts.autostart = true;
  opts.autorestart = true;
  opts.restart_delay = 1000
  if (opts.autoExit)
    autoExit();

  if (opts.ignore) {
    opts.ignore_watch = opts.ignore.split(',')
    opts.ignore_watch.push('node_modules');
  }

  if (timestamp === true)
    timestamp = 'YYYY-MM-DD-HH:mm:ss';

  YRO.start(cmd, opts, function(err, procs) {

    if (err) {
      console.error(err);
      YRO.destroy(function() {
        process.exit(0);
      });
      return false;
    }

    if (opts.testMode) {
      return YRO.disconnect(function() {
        console.log('disconnected succesfully from YRO-dev')
      });
    }

    fmt.title('YRO development mode');
    fmt.field('Apps started', procs.map(function(p) { return p.yro_env.name } ));
    fmt.field('Processes started', chalk.bold(procs.length));
    fmt.field('Watch and Restart', chalk.green('Enabled'));
    fmt.field('Ignored folder', opts.ignore_watch || 'node_modules');
    if (opts.postExec)
      fmt.field('Post restart cmd', opts.postExec);
    fmt.sep();

    setTimeout(function() {
      YRO.Client.launchBus(function(err, bus) {
        bus.on('process:event', function(packet) {
          if (packet.event == 'online') {
            if (opts.postExec)
              postExecCmd(opts.postExec);
          }
        });
      });
    }, 1000);

    Log.devStream(YRO.Client, 'all', opts.raw, timestamp, false);

    process.on('SIGINT', function() {
      console.log('>>>>> [YRO DEV] Stopping current development session');
      YRO.delete('all', function() {
        YRO.destroy(function() {
          process.exit(0);
        });
      });
    });

  });
}

commander.command('*')
  .action(function(cmd, opts){
    run(cmd, commander);
  });

commander.command('start <file|json_file>')
  .description('start target config file/script in development mode')
  .action(function(cmd, opts) {
    run(cmd, commander);
  });

function exitYRO() {
  if (YRO && YRO.connected == true) {
    console.log(chalk.green.bold('>>> Exiting YRO'));
    YRO.kill(function() {
      process.exit(0);
    });
  }
  else
    process.exit(0);
}

function autoExit(final) {
  setTimeout(function() {
    YRO.list(function(err, apps) {
      if (err) console.error(err.stack || err);

      var online_count = 0;

      apps.forEach(function(app) {
        if (app.yro_env.status == cst.ONLINE_STATUS ||
            app.yro_env.status == cst.LAUNCHING_STATUS)
          online_count++;
      });

      if (online_count == 0) {
        console.log('0 application online, exiting');
        if (final == true)
          process.exit(1);
        else
          autoExit(true);
        return false;
      }
      autoExit(false);
    });
  }, 3000);
}

if (process.argv.length == 2) {
  commander.outputHelp();
  exitYRO();
}
