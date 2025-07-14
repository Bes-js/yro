var fs     = require('fs')
var os     = require('os')

function hasDockerEnv() {
	try {
		fs.statSync('/.dockerenv');
		return true;
	} catch (_) {
		return false;
	}
}

function hasDockerCGroup() {
	try {
		return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
	} catch (_) {
		return false;
	}
}

module.exports = function (opts) {
  var params = {
    state: opts.state,
    version: opts.version
  }

  try {
    params.os = os.type()
    params.uptime = Math.floor(process.uptime())
    params.nodev = process.versions.node
    params.docker = hasDockerEnv() || hasDockerCGroup()
  } catch(e) {
  }
}
