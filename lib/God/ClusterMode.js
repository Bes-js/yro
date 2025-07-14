/**
 * Copyright 2013-2022 the YRO project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';

/**
 * @file Cluster execution functions related
 * @author Alexandre Strzelewicz <as@unitech.io>
 * @project YRO
 */
var cluster       = require('cluster');
var Utility       = require('../Utility.js');
var pkg           = require('../../package.json');

/**
 * Description
 * @method exports
 * @param {} God
 * @return
 */
module.exports = function ClusterMode(God) {

  /**
   * For Node apps - Cluster mode
   * It will wrap the code and enable load-balancing mode
   * @method nodeApp
   * @param {} env_copy
   * @param {} cb
   * @return Literal
   */
  God.nodeApp = function nodeApp(env_copy, cb){
    var clu = null;

    console.log(`App [${env_copy.name}:${env_copy.pm_id}] starting in -cluster mode-`)
    if (env_copy.node_args && Array.isArray(env_copy.node_args)) {
      cluster.settings.execArgv = env_copy.node_args;
    }

    env_copy._yro_version = pkg.version;

    try {
      // node.js cluster clients can not receive deep-level objects or arrays in the forked process, e.g.:
      // { "args": ["foo", "bar"], "env": { "foo1": "bar1" }} will be parsed to
      // { "args": "foo, bar", "env": "[object Object]"}
      // So we passing a stringified JSON here.
      clu = cluster.fork({yro_env: JSON.stringify(env_copy), windowsHide: true});
    } catch(e) {
      God.logAndGenerateError(e);
      return cb(e);
    }

    clu.yro_env = env_copy;

    /**
     * Broadcast message to God
     */
    clu.on('message', function cluMessage(msg) {
      /*********************************
       * If you edit this function
       * Do the same in ForkMode.js !
       *********************************/
      if (msg.data && msg.type) {
        return God.bus.emit(msg.type ? msg.type : 'process:msg', {
          at      : Utility.getDate(),
          data    : msg.data,
          process :  {
            pm_id      : clu.yro_env.pm_id,
            name       : clu.yro_env.name,
            rev        : (clu.yro_env.versioning && clu.yro_env.versioning.revision) ? clu.yro_env.versioning.revision : null,
            namespace  : clu.yro_env.namespace
          }
        });
      }
      else {

        if (typeof msg == 'object' && 'node_version' in msg) {
          clu.yro_env.node_version = msg.node_version;
          return false;
        }

        return God.bus.emit('process:msg', {
          at      : Utility.getDate(),
          raw     : msg,
          process :  {
            pm_id      : clu.yro_env.pm_id,
            name       : clu.yro_env.name,
            namespace  : clu.yro_env.namespace
          }
        });
      }
    });

    return cb(null, clu);
  };
};
