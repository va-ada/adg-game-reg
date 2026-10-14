/**
 * DECEPTION - email relay
 *
 * Paste this into script.google.com (signed in as sfit.aidg@gmail.com) and deploy it
 * as a Web App. Mail goes out through that Gmail account, so participants see a real
 * Gmail sender and the server never needs an SMTP password. It also sidesteps Render's
 * free tier, which blocks outbound SMTP ports - this is a plain HTTPS call.
 *
 * SETUP
 *  1. script.google.com -> New project -> paste this file
 *  2. Project Settings -> Script Properties -> Add:
 *       MAIL_TOKEN   = a long random string (must match EMAIL_RELAY_TOKEN on the server)
 *       SENDER_NAME  = ADG x MosaIC - DECEPTION     (optional, this is the default)
 *       REPLY_TO     = an inbox organisers read     (optional)
 *  3. Deploy -> New deployment -> type "Web app"
 *       Execute as:        Me
 *       Who has access:    Anyone
 *     ("Anyone" is required because Render calls this without a Google login.
 *      The MAIL_TOKEN is what actually protects it.)
 *  4. Authorise when prompted (it asks to "send email as you"), then copy the /exec URL
 *  5. Put that URL in EMAIL_RELAY_URL on the server
 *
 * QUOTA: a personal Gmail account can send to roughly 100 recipients a day through
 * Apps Script. Every reply reports what is left, and the server logs it.
 */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty('MAIL_TOKEN');

    if (!expected || body.token !== expected) {
      return json({ success: false, message: 'Unauthorised' });
    }
    if (!body.to || !body.subject || !body.text) {
      return json({ success: false, message: 'Missing to, subject or text' });
    }
    // One recipient per call: this relay must not be usable to blast a list.
    if (String(body.to).indexOf(',') !== -1 || String(body.to).indexOf(';') !== -1) {
      return json({ success: false, message: 'Exactly one recipient per message' });
    }
    if (MailApp.getRemainingDailyQuota() < 1) {
      return json({ success: false, message: 'Daily Gmail quota exhausted', remaining: 0 });
    }

    var options = {
      name: props.getProperty('SENDER_NAME') || 'ADG x MosaIC - DECEPTION'
    };
    if (body.html) options.htmlBody = body.html;
    var replyTo = props.getProperty('REPLY_TO');
    if (replyTo) options.replyTo = replyTo;

    MailApp.sendEmail(String(body.to), String(body.subject), String(body.text), options);

    return json({ success: true, remaining: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return json({ success: false, message: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Lets you confirm the deployment is live by opening the URL in a browser. */
function doGet() {
  return json({ success: true, service: 'DECEPTION email relay', ready: true });
}
