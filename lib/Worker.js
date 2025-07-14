/**
 * Copyright 2013-2022 the YRO project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
const eachLimit = require('async/eachLimit');
const debug     = require('debug')('YRO:worker');
const domain    = require('domain');
const Cron      = require('croner');
const pkg       = require('../package.json');

var cst    = require('../constants.js');
var vCheck = require('./VersionCheck.js')

module.exports = function(God) {
  var timer = null;

  God.CronJobs = new Map();
  God.Worker = {};
  God.Worker.is_running = false;

  God.getCronID = function(pm_id) {
    return `cron-${pm_id}`
  }

  God.registerCron = function(yro_env) {
    if (!yro_env ||
        yro_env.pm_id === undefined ||
        !yro_env.cron_restart ||
        yro_env.cron_restart == '0' ||
        God.CronJobs.has(God.getCronID(yro_env.pm_id)))
      return;

    var pm_id = yro_env.pm_id
    console.log('[YRO][WORKER] Registering a cron job on:', pm_id);

    var job = Cron(yro_env.cron_restart, function() {
      God.restartProcessId({id: pm_id}, function(err, data) {
        if (err)
          console.error(err.stack || err);
        return;
      });
    });

    God.CronJobs.set(God.getCronID(pm_id), job);
  }


  /**
   * Deletes the cron job on deletion of process
   */
  God.deleteCron = function(id) {
    if (typeof(id) !== 'undefined' && God.CronJobs.has(God.getCronID(id)) === false)
      return;
    console.log('[YRO] Deregistering a cron job on:', id);
    var job = God.CronJobs.get(God.getCronID(id));

    if (job)
      job.stop();

    God.CronJobs.delete(God.getCronID(id));
  };

  var _getProcessById = function(pm_id) {
    var proc = God.clusters_db[pm_id];
    return proc ? proc : null;
  };


  var maxMemoryRestart = function(proc_key, cb) {
    var proc = _getProcessById(proc_key.yro_env.pm_id);

    if (!(proc &&
          proc.yro_env &&
          proc_key.monit))
      return cb();

    if (proc_key.monit.memory !== undefined &&
        proc.yro_env.max_memory_restart !== undefined &&
        proc.yro_env.max_memory_restart < proc_key.monit.memory &&
        proc.yro_env.axm_options &&
        proc.yro_env.axm_options.pid === undefined) {
      console.log('[YRO][WORKER] Process %s restarted because it exceeds --max-memory-restart value (current_memory=%s max_memory_limit=%s [octets])', proc.yro_env.pm_id, proc_key.monit.memory, proc.yro_env.max_memory_restart);
      God.reloadProcessId({
        id : proc.yro_env.pm_id
      }, function(err, data) {
        if (err)
          console.error(err.stack || err);
        return cb();
      });
    }
    else {
      return cb();
    }
  };

  var tasks = function() {
    if (God.Worker.is_running === true) {
      debug('[YRO][WORKER] Worker is already running, skipping this round');
      return false;
    }
    God.Worker.is_running = true;

    God.getMonitorData(null, function(err, data) {
      if (err || !data || typeof(data) !== 'object') {
        God.Worker.is_running = false;
        return console.error(err);
      }

      eachLimit(data, 1, function(proc, next) {
        if (!proc || !proc.yro_env || proc.yro_env.pm_id === undefined)
          return next();

        debug('[YRO][WORKER] Processing proc id:', proc.yro_env.pm_id);

        // Reset restart delay if application has an uptime of more > 30secs
        if (proc.yro_env.exp_backoff_restart_delay !== undefined &&
            proc.yro_env.prev_restart_delay && proc.yro_env.prev_restart_delay > 0) {
          var app_uptime = Date.now() - proc.yro_env.pm_uptime
          if (app_uptime > cst.EXP_BACKOFF_RESET_TIMER) {
            var ref_proc = _getProcessById(proc.yro_env.pm_id);
            ref_proc.yro_env.prev_restart_delay = 0
            console.log(`[YRO][WORKER] Reset the restart delay, as app ${proc.name} has been up for more than ${cst.EXP_BACKOFF_RESET_TIMER}ms`)
          }
        }

        // Check if application has reached memory threshold
        maxMemoryRestart(proc, function() {
          return next();
        });
      }, function(err) {
        God.Worker.is_running = false;
        debug('[YRO][WORKER] My job here is done, next job in %d seconds', parseInt(cst.WORKER_INTERVAL / 1000));
      });
    });
  };

  var wrappedTasks = function() {
    var d = domain.create();

    d.once('error', function(err) {
      console.error('[YRO][WORKER] Error caught by domain:\n' + (err.stack || err));
      God.Worker.is_running = false;
    });

    d.run(function() {
      tasks();
    });
  };


  God.Worker.start = function() {
    timer = setInterval(wrappedTasks, cst.WORKER_INTERVAL);

    if (!process.env.YRO_DISABLE_VERSION_CHECK) {
      setInterval(() => {
        vCheck({
          state: 'check',
          version: pkg.version,
        });
      }, 1000 * 60 * 60 * 24);
    }
  };

  God.Worker.stop = function() {
    if (timer !== null)
      clearInterval(timer);
  };
};
