# گرامر — مرور و تمرین

۱۴ درس گرامر انگلیسی با تمرین تعاملی برای فارسی‌زبانان. یک SPAی ساده بدون بک‌اند (HTML + CSS + JS خالص)، قابل نصب به‌عنوان PWA و کارآمد بدون اینترنت.

## اجرای محلی

هیچ سرور ساخت‌نیازی نیست؛ هر سرور استاتیکی کافی است (فایل‌های JSON با `fetch` بارگذاری می‌شوند و `file://` کار نمی‌کند):

```bash
npm install          # فقط برای ابزار تولید آیکون — اختیاری است
npm start            # سرور استاتیک داخلی روی http://localhost:8000

# یا بدون npm:
python3 -m http.server 8000
npx serve -l 8000 .
```

سپس `http://localhost:8000` را باز کنید. سرویس‌ورکر فقط روی `http`/`https` ثبت می‌شود، نه `file://`.

## اعتبارسنجی درس‌ها

```bash
npm run validate     # ساختار، تگ‌ها و تکراری‌ها را روی هر ۱۴ فایل درس چک می‌کند
```

## تولید دوبارهٔ آیکون‌ها

```bash
npm run icons        # assets/icons/*.png + og-image.png (pngjs + sharp — فقط dev)
```

## انتشار روی GitHub Pages

1. مخزن بسازید و کد را push کنید:

   ```bash
   git remote add origin https://github.com/USERNAME/grammar-app.git
   git push -u origin main
   ```

2. در GitHub: Settings → Pages → Build and deployment → Source: **GitHub Actions**
3. حدود ۴۰ ثانیه بعد، تب Actions دیپلوی را کامل می‌کند و سایت روی
   `https://USERNAME.github.io/grammar-app/` بالا می‌آید.

> همهٔ مسیرها در کد نسبی (`./`) هستند؛ بنابراین زیرمسیر `/grammar-app/` مشکلی ایجاد نمی‌کند.

### پیش‌نمایش لینک در تلگرام/فیسبوک

متاتگ `og:image` در `index.html` نسبی است. برای اینکه تلگرام و فیسبوک عکس را نشان دهند، بعد از اولین دیپلوی مقدار آن را URL مطلق کنید:

```html
<meta property="og:image" content="https://USERNAME.github.io/grammar-app/assets/icons/og-image.png">
```

## به‌روزرسانی محتوا (نسخه‌بندی کش)

هر تغییر محتوایی که باید به دست کاربران برسد، سه قدم دارد:

1. فایل درس (JSON) را ویرایش کنید.
2. `version.json`: عدد `v` را ۱ واحد زیاد کنید (مثلاً `{ "v": 2 }`).
3. `sw.js`: `CACHE_VERSION` را به همان عدد جدید تغییر دید (`'2'`).

بعد از push، مرورگرها حداکثر تا ۱۰ دقیقه سرویس‌ورکر تازه را می‌گیرند، کش قدیمی (`grammar-v*`) پاک می‌شود و همه از نو دانلود می‌کنند. اگر فقط خطای تایپی رفع می‌کنید، همین کافی است؛ نیازی به افزایش نسخه برای هر کامیت نیست.

## ساختار پروژه

```
index.html            صفحهٔ اصلی (SPA)
app.css               استایل‌ها
manifest.webmanifest  متادیتای نصب PWA
sw.js                 سرویس‌ورکر (precached + کش داده)
version.json          علامت نسخه برای cache-busting
js/
  main.js             روتر + ثبت سرویس‌ورکر
  data.js             بارگذاری درس‌ها از JSON
  store.js            پیشرفت در localStorage
  engine/             موتور تمرین‌ها (۶ نوع آیتم)
  views/              داشبورد، کتابخانه، درس، مرور، آمار، تنظیمات
data/
  lessons-index.json  فهرست ۱۴ درس
  lessons/*.json       محتوای درس‌ها (۳۰ تمرین هر کدام)
assets/
  fonts/              وزیرمتن (woff2)
  icons/              آیکون‌های PWA + کارت اشتراک‌گذاری
scripts/make-icons.mjs  تولیدکنندهٔ آیکون (فقط dev)
validate-lessons.mjs    اعتبارسنج محتوا (فقط dev)
```

## PWA

- **نصب:** در Chrome آیکون نصب در نوار آدرس، در iOS Safari از منوی اشتراک‌گذاری «Add to Home Screen».
- **آفلاین:** بعد از اولین بازدید، هر ۱۴ درس بدون اینترنت هم کار می‌کنند (داده‌ها و کد در Cache Storage کش می‌شوند).
- **ذخیرهٔ پیشرفت:** در `localStorage` مرورگر همان دستگاه می‌ماند؛ بین دستگاه‌ها همگام نمی‌شود.
