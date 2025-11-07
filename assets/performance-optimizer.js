/**
 * Performance Optimizer Script
 * Improves page loading speed through various optimizations
 */

(function() {
  'use strict';

  // Performance optimization utilities
  const PerformanceOptimizer = {
    
    // Initialize all optimizations
    init: function() {
      this.optimizeImages();
      this.deferNonCriticalCSS();
      this.preloadCriticalResources();
      this.optimizeScrolling();
      this.addLoadingStates();
    },

    // Optimize image loading
    optimizeImages: function() {
      // Add intersection observer for lazy loading
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                img.classList.add('loaded');
                observer.unobserve(img);
              }
            }
          });
        });

        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }
    },

    // Defer non-critical CSS
    deferNonCriticalCSS: function() {
      const nonCriticalCSS = [
        'theme-addons.css',
        'judgeme-reviews.css',
        'account.css'
      ];

      nonCriticalCSS.forEach(cssFile => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = window.Shopify.routes.root + 'assets/' + cssFile;
        link.media = 'print';
        link.onload = function() { this.media = 'all'; };
        document.head.appendChild(link);
      });
    },

    // Preload critical resources
    preloadCriticalResources: function() {
      const criticalResources = [
        { href: window.Shopify.routes.root + 'assets/vendor.min.js', as: 'script' },
        { href: window.Shopify.routes.root + 'assets/theme.js', as: 'script' }
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        document.head.appendChild(link);
      });
    },

    // Optimize scrolling performance
    optimizeScrolling: function() {
      let ticking = false;

      function updateScrollPosition() {
        // Add scroll-based optimizations here
        ticking = false;
      }

      function requestTick() {
        if (!ticking) {
          requestAnimationFrame(updateScrollPosition);
          ticking = true;
        }
      }

      window.addEventListener('scroll', requestTick, { passive: true });
    },

    // Add loading states
    addLoadingStates: function() {
      // Remove loading class when page is fully loaded
      window.addEventListener('load', () => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        
        // Hide preloader
        const preloader = document.getElementById('preloader');
        if (preloader) {
          preloader.classList.add('hidden');
          setTimeout(() => {
            preloader.style.display = 'none';
          }, 500);
        }
      });

      // Add fade-in animation for content
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      });

      // Observe all sections for fade-in animation
      document.querySelectorAll('section, .section').forEach(section => {
        observer.observe(section);
      });
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PerformanceOptimizer.init();
    });
  } else {
    PerformanceOptimizer.init();
  }

})();