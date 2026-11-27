/**
 * Calendar bridge for the chat engine. Lives in the CLIENT's Google account (script.google.com),
 * deployed as a web app: "Execute as: Me", "Who has access: Anyone".
 * Only requests with the right token are served. Set it once:
 *   Project Settings -> Script properties -> TOKEN = <long random string> (same as GAS_TOKEN in the Worker)
 * Optional script property CALENDAR_ID (default: the account's main calendar, the one on the phone).
 *
 * POST JSON:
 *   { token, action: "busy", from, to }                 -> { busy: [{start, end}] }
 *   { token, action: "book", start, end, title, description, capacity, reminderMin } -> { ok, id } | { ok:false, conflict:true }
 * Event texts carry no health data and only the contact the customer wrote from.
 */

function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    out = route_(req);
  } catch (err) {
    out = { error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function route_(req) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("TOKEN");
  if (!token || req.token !== token) return { error: "unauthorized" };
  var cal = calendar_(req.calendar || props.getProperty("CALENDAR_ID"));
  if (req.action === "busy") return { busy: busy_(cal, new Date(req.from), new Date(req.to)) };
  if (req.action === "book") return book_(cal, req);
  return { error: "unknown action" };
}

function calendar_(id) {
  var cal = id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
  if (!cal) throw new Error("calendar not found");
  return cal;
}

/* every event blocks time, all-day events block the whole day; events marked "free" (transparent) do not */
function busy_(cal, from, to) {
  var list = cal.getEvents(from, to);
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var ev = list[i];
    if (ev.getTransparency && String(ev.getTransparency()) === "TRANSPARENT") continue;
    var s = ev.isAllDayEvent() ? ev.getAllDayStartDate() : ev.getStartTime();
    var en = ev.isAllDayEvent() ? ev.getAllDayEndDate() : ev.getEndTime();
    out.push({ start: s.toISOString(), end: en.toISOString() });
  }
  return out;
}

function book_(cal, req) {
  var start = new Date(req.start), end = new Date(req.end);
  if (!(end > start)) return { error: "bad time" };
  if (end - start > 6 * 3600 * 1000) return { error: "too long" };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var overlap = busy_(cal, start, end).length;
    if (overlap >= (req.capacity || 1)) return { ok: false, conflict: true };
    var ev = cal.createEvent(String(req.title || "Booking").slice(0, 120), start, end, { description: String(req.description || "").slice(0, 500) });
    if (req.reminderMin) ev.addPopupReminder(Number(req.reminderMin));
    return { ok: true, id: ev.getId() };
  } finally {
    lock.releaseLock();
  }
}
