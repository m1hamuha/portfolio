/* Calendar adapters. All return busy intervals and create bookings; slot maths lives in time.js.
   - "apps_script": a small Google Apps Script web app inside the client's own Google account
     (apps-script/Calendar.gs). Reads and writes the client's Google Calendar, the one on their phone.
   - "calcom": reads free times from a Cal.com event type; the booking itself is finished on Cal.com by link.
   - "memory": in-memory calendar for tests and demos.
   - "none": no calendar; the engine sends the booking link or takes a request. */

export function makeCalendar(biz, env, fetchImpl = fetch) {
  const kind = (biz.booking && biz.booking.calendar) || "none";

  if (kind === "apps_script") {
    const call = async (payload) => {
      if (!env.GAS_URL || !env.GAS_TOKEN) throw new Error("GAS_URL / GAS_TOKEN not set");
      const res = await fetchImpl(env.GAS_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: env.GAS_TOKEN, calendar: biz.booking.calendar_id || null, ...payload }),
        redirect: "follow",
      });
      const data = await res.json();
      if (data.error) throw new Error(`apps_script: ${data.error}`);
      return data;
    };
    return {
      kind,
      async busy(from, to) { return (await call({ action: "busy", from: from.toISOString(), to: to.toISOString() })).busy || []; },
      async book({ start, end, title, description, capacity = 1, reminderMin }) {
        return call({ action: "book", start: start.toISOString(), end: end.toISOString(), title, description, capacity, reminderMin });
      },
    };
  }

  if (kind === "calcom") {
    return {
      kind,
      /* Cal.com returns free slots, not busy ones; we turn them into a "free" list the engine understands */
      async free(from, to) {
        const u = new URL("https://api.cal.com/v2/slots");
        u.searchParams.set("eventTypeId", String(biz.booking.calcom_event_type_id));
        u.searchParams.set("start", from.toISOString());
        u.searchParams.set("end", to.toISOString());
        u.searchParams.set("timeZone", biz.timezone);
        const res = await fetchImpl(u, { headers: { Authorization: `Bearer ${env.CALCOM_API_KEY}`, "cal-api-version": env.CALCOM_SLOTS_VERSION || "2024-09-04" } });
        if (!res.ok) throw new Error(`calcom ${res.status}`);
        const data = await res.json();
        return Object.values(data.data || {}).flat().map((s) => new Date(s.start || s.time || s));
      },
      async book() { return { ok: false, link: biz.booking.link }; },
    };
  }

  if (kind === "memory") {
    const events = biz.__events || (biz.__events = []);
    return {
      kind,
      events,
      async busy(from, to) { return events.filter((e) => Date.parse(e.start) < to && Date.parse(e.end) > from); },
      async book({ start, end, title, description, capacity = 1 }) {
        const n = events.filter((e) => Date.parse(e.start) < end && Date.parse(e.end) > start).length;
        if (n >= capacity) return { ok: false, conflict: true };
        events.push({ start: start.toISOString(), end: end.toISOString(), title, description });
        return { ok: true, id: `m${events.length}` };
      },
    };
  }

  return { kind: "none" };
}
