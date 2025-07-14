
const UxHelpers = require('./helpers.js')
const p = require('path')

/**
 * Minimal display via YRO ls -m
 * @method miniDisplay
 * @param {Object} list process list
 */
module.exports = function(list) {
  list.forEach(function(l) {

    var mode = l.yro_env.exec_mode.split('_mode')[0]
    var status = l.yro_env.status
    var key = l.yro_env.name || p.basename(l.yro_env.pm_exec_path.script)

    console.log('+--- %s', key)
    console.log('namespace : %s', l.yro_env.namespace)
    console.log('version : %s', l.yro_env.version)
    console.log('pid : %s', l.pid)
    console.log('YRO id : %s', l.yro_env.pm_id)
    console.log('status : %s', status)
    console.log('mode : %s', mode)
    console.log('restarted : %d', l.yro_env.restart_time ? l.yro_env.restart_time : 0)
    console.log('uptime : %s', (l.yro_env.pm_uptime && status == 'online') ? UxHelpers.timeSince(l.yro_env.pm_uptime) : 0)
    console.log('memory usage : %s', l.monit ? UxHelpers.bytesToSize(l.monit.memory, 1) : '')
    console.log('error log : %s', l.yro_env.pm_err_log_path)
    console.log('watching : %s', l.yro_env.watch ? 'yes' : 'no')
    console.log('PID file : %s\n', l.yro_env.pm_pid_path)
  })
}
