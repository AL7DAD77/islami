package com.alhaddad.islami;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** تخزين الجدول محلياً ليبقى الأذان يعمل بعد إعادة تشغيل الهاتف وبدون فتح التطبيق. */
final class AdhanStore {
    static final class Item {
        int id;
        long at;
        String kind = "adhan";
        String prayer = "";
        String title = "";
        String body = "";
        String file = "";
        float volume = 0.9f;
    }

    private static final String PREFS = "adhan_prefs";

    private AdhanStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void save(Context c, List<Item> items, boolean persistent, String city) {
        JSONArray arr = new JSONArray();
        try {
            for (Item it : items) {
                JSONObject o = new JSONObject();
                o.put("id", it.id);
                o.put("at", it.at);
                o.put("kind", it.kind);
                o.put("prayer", it.prayer);
                o.put("title", it.title);
                o.put("body", it.body);
                o.put("file", it.file);
                o.put("volume", (double) it.volume);
                arr.put(o);
            }
        } catch (Exception ignored) {
        }
        prefs(c).edit()
                .putString("items", arr.toString())
                .putBoolean("persistent", persistent)
                .putString("city", city == null ? "" : city)
                .apply();
    }

    static List<Item> load(Context c) {
        List<Item> out = new ArrayList<>();
        String raw = prefs(c).getString("items", "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                Item it = new Item();
                it.id = o.optInt("id");
                it.at = o.optLong("at");
                it.kind = o.optString("kind", "adhan");
                it.prayer = o.optString("prayer", "");
                it.title = o.optString("title", "");
                it.body = o.optString("body", "");
                it.file = o.optString("file", "");
                it.volume = (float) o.optDouble("volume", 0.9);
                out.add(it);
            }
        } catch (Exception ignored) {
        }
        return out;
    }

    static boolean isPersistent(Context c) {
        return prefs(c).getBoolean("persistent", true);
    }

    static void setPersistent(Context c, boolean enabled) {
        prefs(c).edit().putBoolean("persistent", enabled).apply();
    }

    static String city(Context c) {
        return prefs(c).getString("city", "");
    }

    /** أقرب أذان قادم (وليس التذكير). */
    static Item nextAdhan(Context c, long now) {
        Item best = null;
        for (Item it : load(c)) {
            if (!"adhan".equals(it.kind) || it.at <= now) continue;
            if (best == null || it.at < best.at) best = it;
        }
        return best;
    }

    static List<Integer> scheduledIds(Context c) {
        List<Integer> ids = new ArrayList<>();
        String raw = prefs(c).getString("scheduled_ids", "");
        if (raw.isEmpty()) return ids;
        for (String p : raw.split(",")) {
            try {
                ids.add(Integer.parseInt(p.trim()));
            } catch (Exception ignored) {
            }
        }
        return ids;
    }

    static void saveScheduledIds(Context c, List<Integer> ids) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ids.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(ids.get(i));
        }
        prefs(c).edit().putString("scheduled_ids", sb.toString()).apply();
    }
}
