# 🚀 KẾ HOẠCH TỐI ƯU HIỆU SUẤT - HELIOS OPTIMIZE

## 📅 Timeline & Roadmap

### **PHASE 1: QUICK WINS (1-2 ngày)**
Những cải thiện nhanh, dễ implement, tác động cao

#### **1.1 Xóa/Tối ưu setTimeout Delays** ⏱️
**File**: `assets/theme.js`
**Impact**: +500-1000ms

**Current Code (Issue)**:
```js
// Line ~4703
setTimeout(() => {
  $('.lazyload--manual', this).removeClass('lazyload--manual').addClass('lazyload');
}, LocalStorageUtil.get('is_first_visit') === null ? 5000 : 2000);  // ❌ 5 giây quá lâu!
```

**Fixed Code**:
```js
// Use Intersection Observer instead
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      $(entry.target).removeClass('lazyload--manual').addClass('lazyload');
      lazyObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '50px' });

$('.lazyload--manual').each((i, el) => lazyObserver.observe(el));
```

**Benefits**:
- ✅ Load ảnh ngay khi gần viewport
- ✅ Giảm 5 giây delay
- ✅ Better UX

---

#### **1.2 Thêm defer/async cho Scripts** 📜
**File**: `layout/theme.liquid`
**Impact**: +300-500ms

**Current Code**:
```liquid
<script src="{{ 'theme.js' | asset_url }}" defer="defer"></script>
<script src="{{ 'theme-addons.js' | asset_url }}" defer="defer"></script>
```

**Changes Needed**:
```liquid
<!-- Critical scripts (inline) -->
<script>
  // Minimal critical code here
</script>

<!-- Defer non-blocking scripts -->
<script src="{{ 'theme.js' | asset_url }}" defer></script>
<script src="{{ 'theme-addons.js' | asset_url }}" defer></script>

<!-- Async for analytics -->
<script src="{{ 'store-info.v1.0.0.js' | asset_url }}" async></script>
<script src="{{ 'judgeme-reviews.js' | asset_url }}" defer></script>
```

**Benefits**:
- ✅ Non-blocking script loading
- ✅ Faster page render

---

#### **1.3 Preload LCP (Largest Contentful Paint) Image** 🖼️
**File**: `layout/theme.liquid`
**Impact**: +200-300ms

**Add to <head>**:
```liquid
{% if template == 'index' and section.settings.hero_image %}
  <link rel="preload" 
        as="image" 
        href="{{ section.settings.hero_image | image_url: width: 1920 }}"
        imagesrcset="{{ section.settings.hero_image | image_url: width: 480 }} 480w,
                      {{ section.settings.hero_image | image_url: width: 960 }} 960w,
                      {{ section.settings.hero_image | image_url: width: 1280 }} 1280w,
                      {{ section.settings.hero_image | image_url: width: 1920 }} 1920w"
        imagesizes="100vw">
{% endif %}
```

**Benefits**:
- ✅ Hero image loads earlier
- ✅ Better LCP score

---

#### **1.4 Cache oEmbed API Responses** 💾
**File**: `assets/theme.js`
**Impact**: +100-200ms (per page with videos)

**Current Code (Issue)**:
```js
// Line ~1957 - Every time page loads, it fetches from YouTube
fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url))
```

**Fixed Code**:
```js
// Add caching layer
const OEmbedCache = {
  storage: 'oembed_cache',
  
  get: function(url) {
    const cache = JSON.parse(localStorage.getItem(this.storage) || '{}');
    const cached = cache[url];
    
    if (cached && cached.expires > Date.now()) {
      return Promise.resolve(cached.data);
    }
    return null;
  },
  
  set: function(url, data) {
    const cache = JSON.parse(localStorage.getItem(this.storage) || '{}');
    cache[url] = {
      data: data,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    localStorage.setItem(this.storage, JSON.stringify(cache));
  }
};

// Update fetch call
async function getOEmbedData(url) {
  const cached = OEmbedCache.get(url);
  if (cached) return cached;
  
  try {
    const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
    const data = await response.json();
    OEmbedCache.set(url, data);
    return data;
  } catch(e) {
    console.error('oEmbed fetch failed:', e);
    return null;
  }
}
```

**Benefits**:
- ✅ Fewer external API calls
- ✅ Instant video metadata load on repeat visits

---

### **PHASE 2: MEDIUM-TERM IMPROVEMENTS (3-5 ngày)**
Larger refactoring with good ROI

#### **2.1 Inline Critical CSS** 🎨
**File**: `layout/theme.liquid`
**Impact**: +200-400ms (FCP)

**Strategy**:
```liquid
<style>
  /* Critical CSS - Above the fold only */
  
  /* Header */
  header, nav { /* styles */ }
  
  /* Hero section */
  .hero, .slideshow { /* styles */ }
  
  /* Critical buttons */
  button, .btn { /* styles */ }
  
  /* Layout basics */
  body, main, .container { /* styles */ }
</style>

<!-- Load non-critical CSS async -->
<link rel="preload" href="{{ 'theme-addons.css' | asset_url }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{{ 'theme-addons.css' | asset_url }}"></noscript>
```

**Steps**:
1. Identify above-the-fold CSS
2. Inline ~10-15KB critical CSS
3. Defer rest (use media query trick)
4. Test with PageSpeed Insights

---

#### **2.2 Split theme.js into Modules** 📦
**File**: `assets/theme.js` → split into multiple files

**Current**: One 150KB+ file
**After**: Multiple 20-30KB files

**New Structure**:
```
assets/
  ├── theme-core.js (20KB) - Essential
  ├── theme-product.js (25KB) - Product page
  ├── theme-cart.js (20KB) - Cart functionality
  ├── theme-animations.js (30KB) - Animations
  ├── theme-vendor.js (35KB) - External integrations
  └── theme.js (loader)
```

**Load Strategy**:
```liquid
<script src="{{ 'theme-core.js' | asset_url }}" defer></script>

<!-- Load based on page type -->
{% if template contains 'product' %}
  <script src="{{ 'theme-product.js' | asset_url }}" defer></script>
{% elsif template contains 'cart' %}
  <script src="{{ 'theme-cart.js' | asset_url }}" defer></script>
{% endif %}

<!-- Non-critical modules -->
<script src="{{ 'theme-animations.js' | asset_url }}" defer></script>
```

**Benefits**:
- ✅ Smaller initial JS download
- ✅ Parallel loading
- ✅ Better caching

---

#### **2.3 Optimize Image Lazy Loading** 🖼️
**File**: `snippets/responsive-image.liquid`
**Impact**: +200-300ms

**Current Issue**:
```liquid
<img class="rimage__image lazyload--manual"
     data-src="{{ img_url }}"
     data-widths="[460, 540, 720, 900, ...]">  <!-- Too many srcsets -->
```

**Optimized**:
```liquid
<img class="rimage__image lazyload"
     loading="lazy"
     src="{{ image | image_url: width: 100 }}"
     srcset="{{ image | image_url: width: 240 }} 240w,
             {{ image | image_url: width: 480 }} 480w,
             {{ image | image_url: width: 720 }} 720w,
             {{ image | image_url: width: 1024 }} 1024w"
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="{{ image.alt }}">
```

**Benefits**:
- ✅ Native browser lazy loading
- ✅ Simpler srcsets
- ✅ Better performance

---

### **PHASE 3: ADVANCED OPTIMIZATIONS (1-2 tuần)**
Strategic improvements for long-term benefit

#### **3.1 Implement Service Worker** 🔧
**File**: `assets/service-worker.js` (new)
**Impact**: +30-40% on repeat visits

```javascript
const CACHE_NAME = 'helios-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/assets/theme.js',
  '/assets/theme.css',
  '/assets/vendor.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );
});
```

**Registration in theme.liquid**:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/assets/service-worker.js');
}
```

---

#### **3.2 Database Connection Optimization** 🗄️
**File**: `layout/theme.liquid`
**Optimization**: DNS Prefetch, Preconnect

```liquid
<!-- External APIs -->
<link rel="preconnect" href="https://www.youtube.com">
<link rel="preconnect" href="https://vimeo.com">
<link rel="dns-prefetch" href="https://check.cleancanvas.co.uk">

<!-- Images CDN -->
<link rel="preconnect" href="https://cdn.shopify.com">
<link rel="preconnect" href="https://images.unsplash.com">
```

---

#### **3.3 WebP Image Format** 🖼️
**Tool**: ImageMagick or online converter
**Impact**: 25-35% smaller images

```liquid
<picture>
  <source srcset="{{ image | image_url: width: 800 }}.webp" 
          type="image/webp">
  <img src="{{ image | image_url: width: 800 }}" 
       alt="{{ image.alt }}">
</picture>
```

---

### **PHASE 4: MONITORING & MAINTENANCE** 📊
Ongoing performance tracking

#### **4.1 Setup Performance Monitoring**
```javascript
// Add to theme.js
const PerformanceMetrics = {
  track: function() {
    // FCP
    const fcpEntries = performance.getEntriesByName('first-contentful-paint');
    if (fcpEntries.length > 0) {
      console.log('FCP:', fcpEntries[0].startTime);
      this.sendToAnalytics('fcp', fcpEntries[0].startTime);
    }
    
    // LCP
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      this.sendToAnalytics('lcp', lastEntry.renderTime || lastEntry.loadTime);
    });
    observer.observe({entryTypes: ['largest-contentful-paint']});
    
    // CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.sendToAnalytics('cls', clsValue);
        }
      }
    });
    clsObserver.observe({entryTypes: ['layout-shift']});
  },
  
  sendToAnalytics: function(metric, value) {
    // Send to Google Analytics
    if (window.gtag) {
      gtag('event', metric, { value: Math.round(value) });
    }
  }
};

PerformanceMetrics.track();
```

#### **4.2 Performance Budget**
```json
{
  "bundles": [
    {
      "name": "theme.js",
      "maxSize": "30kb",
      "compression": "gzip"
    },
    {
      "name": "theme.css",
      "maxSize": "25kb",
      "compression": "gzip"
    }
  ],
  "metrics": [
    {
      "name": "FCP",
      "maxValue": 1800,
      "unit": "ms"
    },
    {
      "name": "LCP",
      "maxValue": 2500,
      "unit": "ms"
    },
    {
      "name": "CLS",
      "maxValue": 0.1
    }
  ]
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1
- [ ] **Day 1-2**: Remove setTimeout delays (Phase 1.1)
- [ ] **Day 2-3**: Add script defer/async (Phase 1.2)
- [ ] **Day 3-4**: Preload LCP images (Phase 1.3)
- [ ] **Day 4-5**: Cache oEmbed responses (Phase 1.4)

### Week 2
- [ ] **Day 6-7**: Inline critical CSS (Phase 2.1)
- [ ] **Day 8-9**: Split JS modules (Phase 2.2)
- [ ] **Day 10**: Optimize lazy loading (Phase 2.3)

### Week 3-4
- [ ] Service Worker implementation
- [ ] WebP image format
- [ ] Performance monitoring
- [ ] Testing & QA

---

## 🎯 SUCCESS METRICS

### Before Optimization
| Metric | Value |
|--------|-------|
| FCP | 3.5s |
| LCP | 4.8s |
| TTI | 5.5s |
| CLS | 0.15 |
| Page Size | 2.5MB |
| Requests | 85 |

### After Phase 1
| Metric | Value | Improvement |
|--------|-------|------------|
| FCP | 2.8s | -20% |
| LCP | 4.0s | -17% |
| TTI | 4.8s | -13% |

### After Phase 2
| Metric | Value | Improvement |
|--------|-------|------------|
| FCP | 1.8s | -48% |
| LCP | 2.5s | -48% |
| TTI | 3.2s | -42% |

### After Phase 3-4
| Metric | Value | Improvement |
|--------|-------|------------|
| FCP | 1.2s | -66% |
| LCP | 1.8s | -63% |
| TTI | 2.5s | -55% |
| Page Size | 1.2MB | -52% |
| Requests | 45 | -47% |

---

## 🛠️ TOOLS & RESOURCES

### Testing
- PageSpeed Insights: https://pagespeed.web.dev
- GTmetrix: https://gtmetrix.com
- WebPageTest: https://www.webpagetest.org
- Lighthouse: Built-in Chrome DevTools

### Monitoring
- Google Analytics (Core Web Vitals)
- Sentry (Error tracking)
- DataBox (Custom dashboards)

### Optimization Tools
- ImageOptim (Image compression)
- CSSO (CSS minification)
- UglifyJS (JS minification)
- Critical (Critical CSS extraction)

---

## 📞 NOTES

- **Backup before changes**: Commit frequently
- **Test on real devices**: Not just desktop
- **Mobile first**: Most users are mobile
- **Measure twice**: Always measure before/after
- **Iterate**: Optimization is continuous

---

Generated: 2025-11-12
Total Estimated Improvement: **60-70% faster load time**
Estimated Timeline: **3-4 weeks** (full optimization)
Quick Win Timeline: **1-2 days** (Phase 1 only)
