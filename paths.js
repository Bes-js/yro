/**
 * Copyright 2013-2022 the YRO project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */

var debug = require('debug')('yro:paths');
var p     = require('path');
var fs    = require('fs')

function getDefaultYROHome() {
  var YRO_ROOT_PATH;

  if (process.env.YRO_HOME)
    YRO_ROOT_PATH = process.env.YRO_HOME;
  else if (process.env.HOME && !process.env.HOMEPATH)
    YRO_ROOT_PATH = p.resolve(process.env.HOME, '.yro');
  else if (process.env.HOME || process.env.HOMEPATH)
    YRO_ROOT_PATH = p.resolve(process.env.HOMEDRIVE, process.env.HOME || process.env.HOMEPATH, '.yro');
  else {
    console.error('[YRO][Initialization] Environment variable HOME (Linux) or HOMEPATH (Windows) are not set!');
    console.error('[YRO][Initialization] Defaulting to /etc/.yro');
    YRO_ROOT_PATH = p.resolve('/etc', '.yro');
  }

  debug('YRO home resolved to %s', YRO_ROOT_PATH, process.env.HOME);
  return YRO_ROOT_PATH;
}

module.exports = function(YRO_HOME) {
  var has_node_embedded = false

  if (fs.existsSync(p.resolve(__dirname, './node')) === true) {
    has_node_embedded = true
  }

  if (!YRO_HOME) {
    YRO_HOME = getDefaultYROHome()
  }

  var YRO_file_stucture = {
    YRO_HOME                 : YRO_HOME,
    YRO_ROOT_PATH            : YRO_HOME,

    YRO_CONF_FILE            : p.resolve(YRO_HOME, 'conf.js'),
    YRO_MODULE_CONF_FILE     : p.resolve(YRO_HOME, 'module_conf.json'),

    YRO_LOG_FILE_PATH        : p.resolve(YRO_HOME, 'yro.log'),
    YRO_PID_FILE_PATH        : p.resolve(YRO_HOME, 'yro.pid'),

    YRO_RELOAD_LOCKFILE      : p.resolve(YRO_HOME, 'reload.lock'),

    DEFAULT_PID_PATH         : p.resolve(YRO_HOME, 'pids'),
    DEFAULT_LOG_PATH         : p.resolve(YRO_HOME, 'logs'),
    DEFAULT_MODULE_PATH      : p.resolve(YRO_HOME, 'modules'),
    YRO_IO_ACCESS_TOKEN      : p.resolve(YRO_HOME, 'yro-io-token'),
    DUMP_FILE_PATH           : p.resolve(YRO_HOME, 'dump.yro'),
    DUMP_BACKUP_FILE_PATH    : p.resolve(YRO_HOME, 'dump.yro.bak'),

    DAEMON_RPC_PORT          : p.resolve(YRO_HOME, 'rpc.sock'),
    DAEMON_PUB_PORT          : p.resolve(YRO_HOME, 'pub.sock'),
    INTERACTOR_RPC_PORT      : p.resolve(YRO_HOME, 'interactor.sock'),

    INTERACTOR_LOG_FILE_PATH : p.resolve(YRO_HOME, 'agent.log'),
    INTERACTOR_PID_PATH      : p.resolve(YRO_HOME, 'agent.pid'),
    INTERACTION_CONF         : p.resolve(YRO_HOME, 'agent.json5'),

    HAS_NODE_EMBEDDED        : has_node_embedded,
    BUILTIN_NODE_PATH        : has_node_embedded === true ? p.resolve(__dirname, './node/bin/node') : null,
    BUILTIN_NPM_PATH         : has_node_embedded === true ? p.resolve(__dirname, './node/bin/npm') : null,
  };

  // allow overide of file paths via environnement
  var paths = Object.keys(YRO_file_stucture);
  paths.forEach(function (key) {
    var envKey = key.indexOf('YRO_') > -1 ? key : 'YRO_' + key;
    if (process.env[envKey] && key !== 'YRO_HOME' && key !== 'YRO_ROOT_PATH') {
      YRO_file_stucture[key] = process.env[envKey];
    }
  });

  if (process.platform === 'win32' ||
      process.platform === 'win64') {
    //@todo instead of static unique rpc/pub file custom with YRO_HOME or UID
    YRO_file_stucture.DAEMON_RPC_PORT = '\\\\.\\pipe\\rpc.sock';
    YRO_file_stucture.DAEMON_PUB_PORT = '\\\\.\\pipe\\pub.sock';
    YRO_file_stucture.INTERACTOR_RPC_PORT = '\\\\.\\pipe\\interactor.sock';
  }

  return YRO_file_stucture;
};
