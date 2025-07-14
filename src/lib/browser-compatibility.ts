/**
 * Browser Compatibility Layer for Opera Browser
 * Handles Opera-specific issues and provides fallbacks
 */

interface BrowserInfo {
  name: string;
  version: string;
  isOpera: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
}

interface CompatibilityFeatures {
  supportsES6Modules: boolean;
  supportsAsyncAwait: boolean;
  supportsPromises: boolean;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  supportsFetch: boolean;
  supportsWebpack: boolean;
}

class BrowserCompatibility {
  private browserInfo: BrowserInfo;
  private features: CompatibilityFeatures;
  private debug: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    this.browserInfo = this.detectBrowser();
    this.features = this.checkFeatures();
    this.initializeCompatibility();
  }

  private detectBrowser(): BrowserInfo {
    if (typeof window === 'undefined') {
      return {
        name: 'server',
        version: '0.0.0',
        isOpera: false,
        isChrome: false,
        isFirefox: false,
        isSafari: false,
        isEdge: false
      };
    }

    const userAgent = window.navigator.userAgent;
    const vendor = window.navigator.vendor;

    // Opera detection (both old and new versions)
    const isOpera = (
      /Opera|OPR\//.test(userAgent) ||
      /Opera/.test(vendor) ||
      (window as any).opera !== undefined ||
      userAgent.indexOf('OPR/') !== -1
    );

    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(vendor) && !isOpera;
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(vendor);
    const isEdge = /Edg/.test(userAgent);

    let name = 'unknown';
    let version = '0.0.0';

    if (isOpera) {
      name = 'opera';
      const operaVersion = userAgent.match(/OPR\/([0-9.]+)/) || userAgent.match(/Opera\/([0-9.]+)/);
      version = operaVersion ? operaVersion[1] : '0.0.0';
    } else if (isChrome) {
      name = 'chrome';
      const chromeVersion = userAgent.match(/Chrome\/([0-9.]+)/);
      version = chromeVersion ? chromeVersion[1] : '0.0.0';
    } else if (isFirefox) {
      name = 'firefox';
      const firefoxVersion = userAgent.match(/Firefox\/([0-9.]+)/);
      version = firefoxVersion ? firefoxVersion[1] : '0.0.0';
    } else if (isSafari) {
      name = 'safari';
      const safariVersion = userAgent.match(/Version\/([0-9.]+)/);
      version = safariVersion ? safariVersion[1] : '0.0.0';
    } else if (isEdge) {
      name = 'edge';
      const edgeVersion = userAgent.match(/Edg\/([0-9.]+)/);
      version = edgeVersion ? edgeVersion[1] : '0.0.0';
    }

    return {
      name,
      version,
      isOpera,
      isChrome,
      isFirefox,
      isSafari,
      isEdge
    };
  }

  private checkFeatures(): CompatibilityFeatures {
    if (typeof window === 'undefined') {
      return {
        supportsES6Modules: true,
        supportsAsyncAwait: true,
        supportsPromises: true,
        supportsLocalStorage: false,
        supportsSessionStorage: false,
        supportsFetch: false,
        supportsWebpack: true
      };
    }

    return {
      supportsES6Modules: typeof (window as any).Symbol !== 'undefined',
      supportsAsyncAwait: (function() {
        try {
          return (async function() {})().constructor === (async function() {}).constructor;
        } catch (e) {
          return false;
        }
      })(),
      supportsPromises: typeof Promise !== 'undefined',
      supportsLocalStorage: typeof localStorage !== 'undefined',
      supportsSessionStorage: typeof sessionStorage !== 'undefined',
      supportsFetch: typeof fetch !== 'undefined',
      supportsWebpack: (function() {
        try {
          return typeof (window as any).__webpack_require__ !== 'undefined';
        } catch (e) {
          return false;
        }
      })()
    };
  }

  private initializeCompatibility(): void {
    if (this.debug) {
      console.group('%c[BROWSER_COMPAT] Browser Compatibility Check', 'color: #ff6b35; font-weight: bold');
      console.log('🔍 Browser Info:', this.browserInfo);
      console.log('🔧 Features:', this.features);
      console.groupEnd();
    }

    // Apply Opera-specific fixes
    if (this.browserInfo.isOpera) {
      this.applyOperaFixes();
    }

    // Apply general compatibility fixes
    this.applyGeneralFixes();
  }

  private applyOperaFixes(): void {
    if (this.debug) {
      console.group('%c[BROWSER_COMPAT] Applying Opera-specific fixes', 'color: #ff6b35; font-weight: bold');
    }

    // Fix 1: Opera module loading issues
    this.fixOperaModuleLoading();

    // Fix 2: Opera Promise handling
    this.fixOperaPromises();

    // Fix 3: Opera localStorage issues
    this.fixOperaStorage();

    // Fix 4: Opera event handling
    this.fixOperaEvents();

    // Fix 5: Opera webpack issues
    this.fixOperaWebpack();

    if (this.debug) {
      console.log('✅ Opera-specific fixes applied');
      console.groupEnd();
    }
  }

  private fixOperaModuleLoading(): void {
    // Opera sometimes has issues with dynamic imports
    if (typeof window !== 'undefined' && this.browserInfo.isOpera) {
      const originalImport = (window as any).import;
      
      if (!originalImport) {
        // Polyfill for dynamic imports in Opera
        (window as any).import = function(modulePath: string) {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = modulePath;
            
            script.onload = () => {
              resolve({ default: {} });
            };
            
            script.onerror = (error) => {
              reject(new Error(`Failed to load module: ${modulePath}`));
            };
            
            document.head.appendChild(script);
          });
        };
      }
    }
  }

  private fixOperaPromises(): void {
    // Opera sometimes has issues with Promise.allSettled
    if (typeof Promise !== 'undefined' && !Promise.allSettled) {
      Promise.allSettled = function(promises: Promise<any>[]): Promise<any[]> {
        return Promise.all(promises.map(promise => 
          promise
            .then(value => ({ status: 'fulfilled', value }))
            .catch(reason => ({ status: 'rejected', reason }))
        ));
      };
    }
  }

  private fixOperaStorage(): void {
    // Opera sometimes has issues with localStorage/sessionStorage
    if (typeof window !== 'undefined' && this.browserInfo.isOpera) {
      // Create fallback storage if localStorage is not available
      if (!this.features.supportsLocalStorage) {
        (window as any).localStorage = {
          _data: {},
          setItem: function(key: string, value: string) {
            this._data[key] = value;
          },
          getItem: function(key: string) {
            return this._data[key] || null;
          },
          removeItem: function(key: string) {
            delete this._data[key];
          },
          clear: function() {
            this._data = {};
          }
        };
      }
    }
  }

  private fixOperaEvents(): void {
    // Opera sometimes has issues with modern event handling
    if (typeof window !== 'undefined' && this.browserInfo.isOpera) {
      // Ensure CustomEvent is available
      if (typeof CustomEvent === 'undefined') {
        (window as any).CustomEvent = function(type: string, params?: any) {
          const evt = document.createEvent('CustomEvent');
          evt.initCustomEvent(type, params?.bubbles || false, params?.cancelable || false, params?.detail || null);
          return evt;
        };
      }
    }
  }

  private fixOperaWebpack(): void {
    // Opera sometimes has issues with webpack's module system
    if (typeof window !== 'undefined' && this.browserInfo.isOpera) {
      // Ensure __webpack_require__ compatibility
      if (typeof (window as any).__webpack_require__ === 'undefined') {
        (window as any).__webpack_require__ = function(moduleId: string) {
          throw new Error('Module not found: ' + moduleId);
        };
      }

      // Fix webpack factory issues specific to Opera
      const originalError = window.Error;
      window.Error = function(message?: string) {
        const error = new originalError(message);
        // Opera-specific error handling for webpack factories
        if (message && message.includes('Cannot read properties of undefined')) {
          console.warn('[OPERA_COMPAT] Webpack factory error detected, applying fallback');
          return new originalError('Module loading error (Opera compatibility mode)');
        }
        return error;
      } as any;
    }
  }

  private applyGeneralFixes(): void {
    if (this.debug) {
      console.group('%c[BROWSER_COMPAT] Applying general compatibility fixes', 'color: #ff6b35; font-weight: bold');
    }

    // Fetch polyfill
    if (!this.features.supportsFetch) {
      this.polyfillFetch();
    }

    // Promise polyfill
    if (!this.features.supportsPromises) {
      this.polyfillPromises();
    }

    if (this.debug) {
      console.log('✅ General compatibility fixes applied');
      console.groupEnd();
    }
  }

  private polyfillFetch(): void {
    if (typeof window !== 'undefined' && typeof fetch === 'undefined') {
      (window as any).fetch = function(url: string, options?: RequestInit) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(options?.method || 'GET', url);
          
          if (options?.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value as string);
            });
          }
          
          xhr.onload = () => {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText)
            } as Response);
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(options?.body as string);
        });
      };
    }
  }

  private polyfillPromises(): void {
    if (typeof window !== 'undefined' && typeof Promise === 'undefined') {
      // Basic Promise polyfill
      (window as any).Promise = class BasicPromise {
        constructor(executor: (resolve: Function, reject: Function) => void) {
          const resolve = (value: any) => {
            setTimeout(() => {
              if (this.onResolve) this.onResolve(value);
            }, 0);
          };
          
          const reject = (reason: any) => {
            setTimeout(() => {
              if (this.onReject) this.onReject(reason);
            }, 0);
          };
          
          executor(resolve, reject);
        }
        
        private onResolve?: Function;
        private onReject?: Function;
        
        then(onResolve?: Function, onReject?: Function) {
          this.onResolve = onResolve;
          this.onReject = onReject;
          return this;
        }
        
        catch(onReject: Function) {
          this.onReject = onReject;
          return this;
        }
        
        static resolve(value: any) {
          return new BasicPromise((resolve) => resolve(value));
        }
        
        static reject(reason: any) {
          return new BasicPromise((_, reject) => reject(reason));
        }
      };
    }
  }

  // Public API
  public getBrowserInfo(): BrowserInfo {
    return this.browserInfo;
  }

  public getFeatures(): CompatibilityFeatures {
    return this.features;
  }

  public isOpera(): boolean {
    return this.browserInfo.isOpera;
  }

  public needsPolyfills(): boolean {
    return this.browserInfo.isOpera || !this.features.supportsFetch || !this.features.supportsPromises;
  }

  public reportCompatibilityIssue(issue: string, details?: any): void {
    if (this.debug) {
      console.group('%c[BROWSER_COMPAT] Compatibility Issue Reported', 'color: #ff0000; font-weight: bold');
      console.error('Issue:', issue);
      console.error('Details:', details);
      console.error('Browser:', this.browserInfo);
      console.groupEnd();
    }
  }
}

// Create singleton instance
const browserCompatibility = new BrowserCompatibility();

// Export for use in other modules
export default browserCompatibility;
export { BrowserCompatibility };
export type { BrowserInfo, CompatibilityFeatures };