import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private isBrowser: boolean;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Update the page's title, meta tags, Open Graph tags, and Twitter Cards
   */
  updateTags(config: {
    title: string;
    description: string;
    keywords?: string;
    url?: string;
    image?: string;
    robots?: string;
  }) {
    const fullTitle = config.title.includes('Zunify') ? config.title : `${config.title} | Zunify`;
    this.titleService.setTitle(fullTitle);

    // Standard Meta Tags
    this.metaService.updateTag({ name: 'description', content: config.description });
    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    } else {
      this.metaService.removeTag("name='keywords'");
    }
    this.metaService.updateTag({ name: 'robots', content: config.robots || 'index, follow' });

    // Open Graph (Facebook / LinkedIn)
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    if (config.url) {
      this.metaService.updateTag({ property: 'og:url', content: config.url });
    }
    if (config.image) {
      this.metaService.updateTag({ property: 'og:image', content: config.image });
    }
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    if (config.image) {
      this.metaService.updateTag({ name: 'twitter:image', content: config.image });
    }

    // Canonical link
    if (config.url) {
      this.updateCanonicalLink(config.url);
    }
  }

  /**
   * Update or create the canonical link tag in the document header
   */
  private updateCanonicalLink(url: string) {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * Injects JSON-LD structured data into the document head for rich Google search results
   */
  injectSchema(schema: object, schemaId = 'zunify-structured-data') {
    let script = this.document.getElementById(schemaId) as HTMLScriptElement;
    if (script) {
      script.text = JSON.stringify(schema);
    } else {
      script = this.document.createElement('script');
      script.id = schemaId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      this.document.head.appendChild(script);
    }
  }
}
