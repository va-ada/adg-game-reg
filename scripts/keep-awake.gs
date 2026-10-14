/**
 * DECEPTION - keep-awake pinger
 *
 * Render's free plan sleeps the server after ~15 minutes without a request, and the
 * next visitor waits about a minute for it to wake. This pings /api/health every
 * 5 minutes so it never sleeps, emails you if the site goes down (and once when it
 * comes back), and switches itself off after the event.
 *
 * Add it as a SECOND file in the same Apps Script project as email-sender.gs
 * (or a new project - either works). It does not need a new deployment.
 *
 * SETUP
 *  1. In the editor: Files "+" -> Script -> name it keep-awake -> paste this file
 *  2. Project Settings -> Script Properties -> Add:
 *       SITE_URL     = https://your-site.onrender.com   (no trailing slash)
 *       ALERT_EMAIL  = where down/up alerts go          (optional, defaults to you)
 *  3. Back in the editor, pick "installPinger" in the function dropdown -> Run
 *     Authorise when prompted (it asks to "connect to an external service").
 *  4. Check: pick "pingNow" -> Run -> the Execution log shows the site's reply.
 *
 * Use "removePinger" to stop it early. It also removes itself after STOP_AFTER.
 */

var STOP_AFTER = new Date('2026-10-18T00:00:00+05:30'); // the morning after the event
var FAILS_BEFORE_ALERT = 2; // one slow cold start is not an outage

function installPinger() {
  removePinger();
  ScriptApp.newTrigger('ping').timeBased().everyMinutes(5).create();
  Logger.log('Pinger installed: every 5 minutes until ' + STOP_AFTER);
  pingNow();
}

function removePinger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'ping') ScriptApp.deleteTrigger(t);
  });
  Logger.log('Pinger removed.');
}

/** Run by hand to see the result in the Execution log. */
function pingNow() {
  Logger.log(JSON.stringify(check()));
}

/** Run by the trigger every 5 minutes. */
function ping() {
  if (new Date() > STOP_AFTER) {
    removePinger();
    return;
  }

  var props = PropertiesService.getScriptProperties();
  var result = check();
  var fails = Number(props.getProperty('PING_FAILS') || 0);

  if (result.ok) {
    // Alert once on recovery, only if we had told them it was down.
    if (props.getProperty('PING_ALERTED') === 'yes') {
      alert('[DECEPTION] Site is back UP', 'The site answered again at ' + new Date() + '.');
      props.deleteProperty('PING_ALERTED');
    }
    props.setProperty('PING_FAILS', '0');
    return;
  }

  fails++;
  props.setProperty('PING_FAILS', String(fails));
  // Alert once per outage, not every 5 minutes: alerts share the ~100/day Gmail quota
  // with the participant emails.
  if (fails >= FAILS_BEFORE_ALERT && props.getProperty('PING_ALERTED') !== 'yes') {
    alert(
      '[DECEPTION] Site is DOWN',
      'The site has failed ' + fails + ' checks in a row.\n\nLast error: ' + result.error +
      '\n\nCheck the Render dashboard (Events and Logs) for the service.'
    );
    props.setProperty('PING_ALERTED', 'yes');
  }
}

function check() {
  var site = PropertiesService.getScriptProperties().getProperty('SITE_URL');
  if (!site) return { ok: false, error: 'SITE_URL script property is not set' };

  var url = site.replace(/\/+$/, '') + '/api/health';
  var started = Date.now();
  try {
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    var code = res.getResponseCode();
    var ms = Date.now() - started;
    if (code === 200) return { ok: true, status: code, ms: ms };
    return { ok: false, status: code, ms: ms, error: 'HTTP ' + code + ' from ' + url };
  } catch (err) {
    return { ok: false, error: String(err) + ' (' + url + ')' };
  }
}

function alert(subject, body) {
  var to = PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL') ||
    Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(to, subject, body);
}
