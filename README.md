<div align="center">
 <br/>

<b>YRO<br/>
  <i>Runtime Edition</i>
<br/><br/>


<a title="yro Downloads" href="https://npm-stat.com/charts.html?package=yro">
  <img src="https://img.shields.io/npm/dy/yro" alt="Downloads per Year"/>
</a>

<a href="https://badge.fury.io/js/yro" title="NPM Version Badge">
   <img src="https://badge.fury.io/js/yro.svg" alt="npm version">
</a>

<br/>
<br/>
<br/>
</div>


YRO is a production process manager for Node.js/Bun applications with a built-in load balancer. It allows you to keep applications alive forever, to reload them without downtime and to facilitate common system admin tasks.

Starting an application in production mode is as easy as:

```bash
$ yro start app.js
```

Official Yro & PM2 website: [https://pm2.keymetrics.io/](https://pm2.keymetrics.io/)

Works on Linux (stable) & macOS (stable) & Windows (stable). All Node.js versions are supported starting Node.js 12.X and Bun since v1


## Installing YRO

### With NPM

```bash
$ npm install yro -g
```

### With Bun

```bash
$ bun install yro -g
```
**Please note that you might need to symlink node to bun if you only want to use bun via `sudo ln -s /home/$USER/.bun/bin/bun /usr/bin/node`**

___

You can install Node.js easily with [NVM](https://github.com/nvm-sh/nvm#installing-and-updating) or [FNM](https://github.com/Schniz/fnm) or install Bun with `curl -fsSL https://bun.sh/install | bash`

### Start an application

You can start any application (Node.js, Bun, and also Python, Ruby, binaries in $PATH...) like that:

```bash
$ yro start app.js
```

Your app is now daemonized, monitored and kept alive forever.

### Managing Applications

Once applications are started you can manage them easily:

To list all running applications:

```bash
$ yro list
```

Managing apps is straightforward:

```bash
$ yro stop     [app_name|namespace|id|'all'|json_conf]
$ yro restart  [app_name|namespace|id|'all'|json_conf]
$ yro delete   [app_name|namespace|id|'all'|json_conf]
```

To have more details on a specific application:

```bash
$ yro describe <id|app_name>
```

To monitor logs, custom metrics, application information:

```bash
$ yro monit
```

[More about Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)

### Cluster Mode: Node.js Load Balancing & Zero Downtime Reload

The Cluster mode is a special mode when starting a Node.js application, it starts multiple processes and load-balance HTTP/TCP/UDP queries between them. This increase overall performance (by a factor of x10 on 16 cores machines) and reliability (faster socket re-balancing in case of unhandled errors).

Starting a Node.js application in cluster mode that will leverage all CPUs available:

```bash
$ yro start api.js -i <processes>
```

`<processes>` can be `'max'`, `-1` (all cpu minus 1) or a specified number of instances to start.

**Zero Downtime Reload**

Hot Reload allows to update an application without any downtime:

```bash
$ yro reload all
```

[More informations about how YRO & PM2 make clustering easy](https://pm2.keymetrics.io/docs/usage/cluster-mode/)

### Container Support

With the drop-in replacement command for `node`, called `yro-runtime`, run your Node.js application in a hardened production environment.
Using it is seamless:

```
RUN npm install yro -g
CMD [ "yro-runtime", "npm", "--", "start" ]
```

[Read More about the dedicated integration](https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/)

### Host monitoring speedbar

YRO allows to monitor your host/server vitals with a monitoring speedbar.

To enable host monitoring:

```bash
$ yro set YRO:sysmonit true
$ yro update
```

Monitor all processes launched straight from the command line:

```bash
$ yro monit
```

### Log Management

To consult logs just type the command:

```bash
$ yro logs
```

Standard, Raw, JSON and formated output are available.

Examples:

```bash
$ yro logs APP-NAME       # Display APP-NAME logs
$ yro logs --json         # JSON output
$ yro logs --format       # Formated output

$ yro flush               # Flush all logs
$ yro reloadLogs          # Reload all logs
```

To enable log rotation install the following module

```bash
$ yro install pm2-logrotate
```

[More about log management](https://pm2.keymetrics.io/docs/usage/log-management/)

### Startup Scripts Generation

YRO can generate and configure a Startup Script to keep YRO and your processes alive at every server restart.

Init Systems Supported: **systemd**, **upstart**, **launchd**, **rc.d**

```bash
# Generate Startup Script
$ yro startup

# Freeze your process list across server restart
$ yro save

# Remove Startup Script
$ yro unstartup
```

[More about Startup Scripts Generation](https://pm2.keymetrics.io/docs/usage/startup/)

### Updating YRO

```bash
# Install latest YRO version
$ npm install yro@latest -g
# Save process list, exit old YRO & restore all processes
$ yro update
```

*YRO updates are seamless*

Thanks in advance and we hope that you like YRO!


## License

YRO is forked version of PM2 made available under the terms of the GNU Affero General Public License 3.0 (AGPL 3.0).
For other licenses [contact us](mailto:contact@keymetrics.io).
