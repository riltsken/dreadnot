/*
 *  Copyright 2011 Rackspace
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

var sprintf = require('./sprintf');
var log = require('logmagic').local('deploy.helpers.misc');
var spawn = require('child_process').spawn;
var logFormatter = require('./log_formatter');


/**
 * Get unix timestamp.
 * @param {?Date} date Date object.
 * @return {Number} unix timestamp.
 */
exports.getUnixTimestamp = function getUnixTimestamp(date) {
  date = date || new Date();
  date = date.getTime();
  return Math.round(date / 1000);
};


/** Spawn a subprocess and issue the callback.
 * @param {Array} cmd Command and Arguments.
 * @param {Options} spawnOpts Options object passed to the spawn command.
 * @param {Function} callback Completion callback(err, stdout, stderr).
 */
exports.spawn = function(cmd, spawnOpts, callback) {
  var args,
      diff,
      proc,
      cmdStr,
      stdoutClosed = false,
      stderrClosed = false,
      exitCode,
      stdoutLogFormatter,
      stderrLogFormatter;

  // Copy command so we don't override the parent
  cmd = cmd.slice();
  args = cmd.splice(1);

  cmdStr = sprintf('%s %s', cmd[0], args.join(' '));
  log.info('Executing Command', {'cmd': cmdStr});

  try {
    stdoutLogFormatter = logFormatter[spawnOpts.logFormatter](spawnOpts.logFormatter.options);
    stderrLogFormatter = logFormatter[spawnOpts.logFormatter](spawnOpts.logFormatter.options);
  } catch (err) {
    stdoutLogFormatter = logFormatter['default']();
    stderrLogFormatter = logFormatter['default']();
  }

  proc = spawn(cmd[0], args, spawnOpts);
  proc.stdout.on('data', function(data) {
    stdoutLogFormatter.receive(data);
  });
  proc.stderr.on('data', function(data) {
    stderrLogFormatter.receive(data);
  });

  function closingEvent() {
    var err, stdoutResult, stderrResult;

    stdoutResult = stdoutLogFormatter.result();
    stderrResult = stderrLogFormatter.result();
    if (stdoutClosed && stderrClosed && exitCode !== undefined) {
      log.info('Command finished', {'cmd': cmdStr, 'code': exitCode, 'stdout': stdoutResult, 'stderr': stderrResult});

      if (exitCode) {
        err = new Error(sprintf('Failed command %s:\nstderr:\n%s\nstdout:\n%s', cmdStr, stderrResult, stdoutResult));
      }

      callback(err, stdoutResult, stderrResult);
    }
  }
  proc.stdout.on('close', function() {
    stdoutClosed = true;
    closingEvent();
  });
  proc.stderr.on('close', function() {
    stderrClosed = true;
    closingEvent();
  });
  proc.on('exit', function(code) {
    exitCode = code;
    closingEvent();
  });
};


/**
 * Execute a command using a task's baton and args to log and honor dryrun.
 * @param {Object} baton A task's baton with a logger.
 * @param {Object} args A task's args which may contain 'dryrun'.
 * @param {Array} cmd The command and its arguments.
 * @param {Object} options An options object to pass to spawn.
 * @param {Function} callback A callback fired with (err, stdout, stderr).
 */
exports.taskSpawn = function(baton, args, cmd, options, callback) {
  var cmdStr = cmd.join(' '),
      start = Date.now();

  if (args.dryrun) {
    baton.log.infof('dry run, skipping command: ${cmd}', {
      cmd: cmdStr
    });
    callback();
    return;
  }

  baton.log.infof('executing command: ${cmd}', {
    cmd: cmdStr
  });

  exports.spawn(cmd, options, function(err, stdout, stderr) {
    var took = (Date.now() - start) / 1000;

    if (err) {
      baton.log.errorf('error executing command: ${cmd}', {
        cmd: cmdStr,
        err: err,
        stdout: stdout,
        stderr: stderr,
        took: took
      });
    } else {
      baton.log.infof('command successful: ${cmd}', {
        cmd: cmdStr,
        stdout: stdout,
        stderr: stderr,
        took: took
      });
    }
    callback(err, stdout, stderr);
  });
};


exports.randstr = function(len) {
  var chars, r, x;

  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  r = [];

  for (x = 0; x < len; x++) {
    r.push(chars[exports.getRandomInt(0, chars.length - 1)]);
  }

  return r.join('');
};


exports.getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


exports.merge = function(a, b) {
  var c = {}, attrname;

  for (attrname in a) {
    if (a.hasOwnProperty(attrname)) {
      c[attrname] = a[attrname];
    }
  }
  for (attrname in b) {
    if (b.hasOwnProperty(attrname)) {
      c[attrname] = b[attrname];
    }
  }
  return c;
};


exports.copyEnv = function() {
  var env = {}, key;

  for (key in process.env) {
    env[key] = process.env[key];
  }

  return env;
};
