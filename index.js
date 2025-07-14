/**
 * Copyright 2013-2022 the Yro project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */

process.env.YRO_PROGRAMMATIC = 'true';

var API = require('./lib/API.js');

module.exports = new API;
module.exports.custom = API;
