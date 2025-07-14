const Table = require('cli-tableau')
const chalk = require('ansis')
const UxHelpers = require('./helpers.js')
const Common = require('../../Common.js')

var postModuleInfos = function(module_name, human_info) {
  var table = new Table({
    style : {'padding-left' : 1, head : ['cyan', 'bold'], compact : true}
  })

  var disp = {}

  human_info.unshift(['Module name', module_name])
  human_info.forEach(function(info) {
    var obj = {}
    obj[chalk.bold.cyan(info[0])] = info[1]
    table.push(obj)
  })

  console.log()
  console.log(chalk.bold.inverse(' Module %s infos '), module_name)
  console.log(table.toString())
}

/**
 * Description
 * @method describeTable
 * @param {Object} proc process list
 */
module.exports = function(proc) {
  var table = new Table({
    style : {'padding-left' : 1, head : ['cyan', 'bold'], compact : true}
  })

  var yro_env = proc.yro_env

  var created_at = 'N/A'

  if (yro_env.axm_options && yro_env.axm_options.human_info) {
    postModuleInfos(yro_env.name, yro_env.axm_options.human_info)
  }

  try {
    if (yro_env.created_at != null)
      created_at = new Date(yro_env.created_at).toISOString()
  } catch (e) {
  }

  console.log(chalk.bold.inverse(' Describing process with id %d - name %s '), yro_env.pm_id, yro_env.name)
  UxHelpers.safe_push(table,
            { 'status' : UxHelpers.colorStatus(yro_env.status) },
            { 'name': yro_env.name },
            { 'namespace': yro_env.namespace },
            { 'version': yro_env.version },
            { 'restarts' : yro_env.restart_time },
            { 'uptime' : (yro_env.pm_uptime && yro_env.status == 'online') ? UxHelpers.timeSince(yro_env.pm_uptime) : 0 },
            { 'script path' : yro_env.pm_exec_path },
            { 'script args' : yro_env.args ? (typeof yro_env.args == 'string' ? JSON.parse(yro_env.args.replace(/'/g, '"')):yro_env.args).join(' ') : null },
            { 'error log path' : yro_env.pm_err_log_path },
            { 'out log path' : yro_env.pm_out_log_path },
            { 'pid path' : yro_env.pm_pid_path },

            { 'interpreter' : yro_env.exec_interpreter },
            { 'interpreter args' : yro_env.node_args.length != 0 ? yro_env.node_args : null },

            { 'script id' : yro_env.pm_id },
            { 'exec cwd' : yro_env.pm_cwd },

            { 'exec mode' : yro_env.exec_mode },
            { 'node.js version' : yro_env.node_version },
            { 'node env': yro_env.env.NODE_ENV },
            { 'watch & reload' : yro_env.watch ? chalk.green.bold('✔') : '✘' },
            { 'unstable restarts' : yro_env.unstable_restarts },
            { 'created at' : created_at }
           )

  if ('pm_log_path' in yro_env){
    table.splice(6, 0, {'entire log path': yro_env.pm_log_path})
  }

  if ('cron_restart' in yro_env){
    table.splice(5, 0, {'cron restart': yro_env.cron_restart})
  }

  console.log(table.toString())

  /**
   * Module conf display
   */
  if (yro_env.axm_options &&
      yro_env.axm_options.module_conf &&
      Object.keys(yro_env.axm_options.module_conf).length > 0) {
    var table_conf = new Table({
      style : {'padding-left' : 1, head : ['cyan', 'bold'], compact : true}
    })
    console.log('Process configuration')

    Object.keys(yro_env.axm_options.module_conf).forEach(function(key) {
      var tmp = {}
      tmp[key] = yro_env.axm_options.module_conf[key]
      UxHelpers.safe_push(table_conf, tmp)
    })

    console.log(table_conf.toString())
  }

  /**
   * Versioning metadata
   */
  if (yro_env.versioning) {

    var table2 = new Table({
      style : {'padding-left' : 1, head : ['cyan', 'bold'], compact : true}
    })

    console.log(chalk.inverse.bold(' Revision control metadata '))
    UxHelpers.safe_push(table2,
              { 'revision control' : yro_env.versioning.type },
              { 'remote url' : yro_env.versioning.url },
              { 'repository root' : yro_env.versioning.repo_path },
              { 'last update' : yro_env.versioning.update_time },
              { 'revision' : yro_env.versioning.revision },
              { 'comment' :  yro_env.versioning.comment ? yro_env.versioning.comment.trim().slice(0, 60) : '' },
              { 'branch' :  yro_env.versioning.branch }
             )
    console.log(table2.toString())
  }

  if (yro_env.axm_actions && Object.keys(yro_env.axm_actions).length > 0) {
    var table_actions = new Table({
      style : {'padding-left' : 1, head : ['cyan', 'bold'], compact : true}
    })

    console.log(chalk.inverse.bold(' Actions available '))
    yro_env.axm_actions.forEach(function(action_set) {
      UxHelpers.safe_push(table_actions, [action_set.action_name])
    })

    console.log(table_actions.toString())
    Common.printOut(chalk.white.italic(' Trigger via: yro trigger %s <action_name>\n'), yro_env.name)
  }

  if (yro_env.axm_monitor && Object.keys(yro_env.axm_monitor).length > 0) {
    var table_probes = new Table({
      style : {'padding-left' : 1, head : ['cyan', 'bold'], compact : true}
    })

    console.log(chalk.inverse.bold(' Code metrics value '))
    Object.keys(yro_env.axm_monitor).forEach(function(key) {
      var obj = {}
      var metric_name = yro_env.axm_monitor[key].hasOwnProperty("value") ? yro_env.axm_monitor[key].value : yro_env.axm_monitor[key]
      var metric_unit = yro_env.axm_monitor[key].hasOwnProperty("unit") ? yro_env.axm_monitor[key].unit : ''
      var value = `${metric_name} ${metric_unit}`
      obj[key] = value
      UxHelpers.safe_push(table_probes, obj)
    })

    console.log(table_probes.toString())
  }

  var table_env = new Table({
    style : {'padding-left' : 1, head : ['cyan', 'bold'], compact : true}
  })

  console.log(chalk.inverse.bold(' Divergent env variables from local env '))

  var _env = Common.safeExtend({}, yro_env)
  var diff_env = {}

  Object.keys(process.env).forEach(k => {
    if (!_env[k] || _env[k] != process.env[k]) {
      diff_env[k] = process.env[k]
    }
  })

  Object.keys(diff_env).forEach(function(key) {
    var obj = {}
    if (_env[key]) {
      // 1. fix env value is not a String and slice is undeinfed
      // 2. fix process.stdout.columns is undefined and causes empty string output
      // 3. columns defaults to 300 - same as specified in YRO-ls
      obj[key] = String(_env[key]).slice(0, (process.stdout.columns || 300) - 60)
      UxHelpers.safe_push(table_env, obj)
    }
  })

  console.log(table_env.toString())
  console.log()
  Common.printOut(chalk.white.italic(' Add your own code metrics: http://bit.ly/code-metrics'))
  Common.printOut(chalk.white.italic(' Use `yro logs %s [--lines 1000]` to display logs'), yro_env.name)
  Common.printOut(chalk.white.italic(' Use `yro env %s` to display environment variables'), yro_env.pm_id)
  Common.printOut(chalk.white.italic(' Use `yro monit` to monitor CPU and Memory usage'), yro_env.name)
}
