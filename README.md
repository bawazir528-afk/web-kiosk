# Web Refresh Display (نسخة ويب)

نسخة تعمل على **أي شاشة ذكية/متصفح** (Android TV، Samsung Tizen، LG webOS، Raspberry Pi، Windows kiosk، إلخ).

## الاستخدام
1. استضف المجلد `web-kiosk` على أي خادم ويب (أو افتح `index.html` محلياً).
2. افتح:
   ```
   https://your-host/index.html?url=https://example.com/dashboard&interval=60
   ```
3. أو افتح без معاملات وستظهر شاشة إعداد (يُحفظ في localStorage).

## المعاملات (query params)
- `url` — رابط الصفحة.
- `interval` — فاصل التحديث بالثواني (افتراضي 60).
- `toolbar` — `0` لإخفاء شريط الأدوات.

## اختصارات لوحة المفاتيح
- `F5` / `Ctrl+R` — تحديث فوري.
- `S` — إعدادات.
- `H` — إظهار/إخفاء شريط الأدوات.

## تحديث جزئي
إذا عرّفت `window.onRefresh` في الصفحة المحمّلة (same-origin)، ستُستدعى بدلاً من إعادة تحميل كاملة.

## بقاء الشاشة مضاءة
يستخدم Wake Lock API (مدعوم في معظم المتصفحات الحديثة).

## ملاحظة: مواقع تمنع التضمين (iframe)
بعض المواقع (مثل CNN) ترسل ترويسات `X-Frame-Options` / `CSP` تمنع عرضها داخل iframe. في هذه الحالة:
- استخدم زر «فتح خارجياً» لفتح الموقع في تبويب جديد.
- أو استخدم **تطبيق Android** (WebView يحمّل الموقع مباشرة دون قيود iframe).
- أو استخدم متصفح kiosk (مثل Fully Kiosk Browser) مع ميزة Auto Refresh.