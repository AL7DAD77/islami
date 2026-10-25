package com.alhaddad.islami;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * AdhanStore
 *
 * مسؤول عن حفظ واسترجاع بيانات مواقيت الصلاة والتنبيهات
 * في SharedPreferences.
 */
public final class AdhanStore {

    private static final String TAG = "AdhanStore";

    private static final String PREFS_NAME = "adhan_store_prefs";

    private static final String KEY_ITEMS = "items";
    private static final String KEY_PERSISTENT = "persistent";
    private static final String KEY_CITY = "city";
    private static final String KEY_SCHEDULED_IDS = "scheduled_ids";

    private static final String JSON_ID = "id";
    private static final String JSON_AT = "at";
    private static final String JSON_KIND = "kind";
    private static final String JSON_PRAYER = "prayer";
    private static final String JSON_TITLE = "title";
    private static final String JSON_BODY = "body";
    private static final String JSON_FILE = "file";
    private static final String JSON_VOLUME = "volume";

    private static final float DEFAULT_VOLUME = 1.0f;

    private AdhanStore() {
        // منع إنشاء كائن من هذا الكلاس
    }

    /* ============================== النموذج ============================== */

    public static final class Item {

        public int id;
        public long at;
        public String kind;
        public String prayer;
        public String title;
        public String body;
        public String file;
        public float volume;

        public Item() {
            this.id = 0;
            this.at = 0L;
            this.kind = "";
            this.prayer = "";
            this.title = "";
            this.body = "";
            this.file = "";
            this.volume = DEFAULT_VOLUME;
        }

        public boolean isValid() {
            return id > 0 &&
                    at > 0 &&
                    kind != null &&
                    !kind.trim().isEmpty();
        }
    }

    /* ============================== القراءة ============================== */

    public static List<Item> load(Context context) {
        List<Item> items = new ArrayList<>();

        if (context == null) {
            return items;
        }

        String rawData = getPreferences(context)
                .getString(KEY_ITEMS, null);

        if (rawData == null || rawData.trim().isEmpty()) {
            return items;
        }

        try {
            JSONArray jsonArray = new JSONArray(rawData);

            for (int index = 0; index < jsonArray.length(); index++) {
                JSONObject json = jsonArray.optJSONObject(index);
                Item item = parseItem(json);

                if (item != null) {
                    items.add(item);
                }
            }

        } catch (Exception e) {
            Log.e(TAG, "خطأ في قراءة بيانات التنبيهات", e);
        }

        return items;
    }

    private static Item parseItem(JSONObject json) {
        if (json == null) {
            return null;
        }

        Item item = new Item();

        item.id = json.optInt(JSON_ID, 0);
        item.at = json.optLong(JSON_AT, 0L);
        item.kind = json.optString(JSON_KIND, "");
        item.prayer = json.optString(JSON_PRAYER, "");
        item.title = json.optString(JSON_TITLE, "");
        item.body = json.optString(JSON_BODY, "");
        item.file = json.optString(JSON_FILE, "");
        item.volume = (float) json.optDouble(JSON_VOLUME, DEFAULT_VOLUME);

        if (!item.isValid()) {
            return null;
        }

        return item;
    }

    /* ============================== الحفظ ============================== */

    public static void save(
            Context context,
            List<Item> items,
            boolean persistent,
            String city
    ) {
        if (context == null) {
            return;
        }

        try {
            JSONArray jsonArray = new JSONArray();

            if (items != null) {
                for (Item item : items) {
                    if (item == null || !item.isValid()) {
                        continue;
                    }
                    jsonArray.put(toJson(item));
                }
            }

            SharedPreferences.Editor editor = getPreferences(context).edit();
            editor.putString(KEY_ITEMS, jsonArray.toString());
            editor.putBoolean(KEY_PERSISTENT, persistent);
            editor.putString(KEY_CITY, city == null ? "" : city);
            editor.apply();

        } catch (Exception e) {
            Log.e(TAG, "خطأ في حفظ بيانات التنبيهات", e);
        }
    }

    private static JSONObject toJson(Item item) {
        JSONObject json = new JSONObject();

        try {
            json.put(JSON_ID, item.id);
            json.put(JSON_AT, item.at);
            json.put(JSON_KIND, item.kind == null ? "" : item.kind);
            json.put(JSON_PRAYER, item.prayer == null ? "" : item.prayer);
            json.put(JSON_TITLE, item.title == null ? "" : item.title);
            json.put(JSON_BODY, item.body == null ? "" : item.body);
            json.put(JSON_FILE, item.file == null ? "" : item.file);
            json.put(JSON_VOLUME, item.volume);
        } catch (Exception e) {
            Log.e(TAG, "خطأ في تحويل عنصر التنبيه إلى JSON", e);
        }

        return json;
    }

    /* ========================= الإشعار الدائم ========================= */

    public static boolean isPersistent(Context context) {
        if (context == null) {
            return true;
        }
        return getPreferences(context).getBoolean(KEY_PERSISTENT, true);
    }

    public static void setPersistent(Context context, boolean enabled) {
        if (context == null) {
            return;
        }
        getPreferences(context).edit().putBoolean(KEY_PERSISTENT, enabled).apply();
    }

    /* ============================== المدينة ============================== */

    public static String getCity(Context context) {
        if (context == null) {
            return "";
        }
        return getPreferences(context).getString(KEY_CITY, "");
    }

    public static void setCity(Context context, String city) {
        if (context == null) {
            return;
        }
        getPreferences(context).edit().putString(KEY_CITY, city == null ? "" : city).apply();
    }

    /* ====================== معرفات التنبيهات المجدولة ====================== */

    public static List<Integer> scheduledIds(Context context) {
        List<Integer> ids = new ArrayList<>();

        if (context == null) {
            return ids;
        }

        String rawData = getPreferences(context).getString(KEY_SCHEDULED_IDS, null);

        if (rawData == null || rawData.trim().isEmpty()) {
            return ids;
        }

        try {
            JSONArray jsonArray = new JSONArray(rawData);
            for (int index = 0; index < jsonArray.length(); index++) {
                int id = jsonArray.optInt(index, 0);
                if (id > 0) {
                    ids.add(id);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "خطأ في قراءة معرفات التنبيهات المجدولة", e);
        }

        return ids;
    }

    public static void saveScheduledIds(Context context, List<Integer> ids) {
        if (context == null) {
            return;
        }

        try {
            JSONArray jsonArray = new JSONArray();

            if (ids != null) {
                for (Integer id : ids) {
                    if (id != null && id > 0) {
                        jsonArray.put(id);
                    }
                }
            }

            getPreferences(context).edit().putString(KEY_SCHEDULED_IDS, jsonArray.toString()).apply();

        } catch (Exception e) {
            Log.e(TAG, "خطأ في حفظ معرفات التنبيهات المجدولة", e);
        }
    }

    /* ============================ دوال مساعدة ============================ */

    private static SharedPreferences getPreferences(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}