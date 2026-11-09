export class TOCController {
  private static readonly CIRCUMFERENCE = 2 * Math.PI * 10;
  private headings: HTMLElement[] = [];
  private regions: { id: string; start: number; end: number }[] = [];
  private activeId: string = "";
  private progressCircle: SVGCircleElement | null = null;
  private currentSectionText: HTMLElement | null = null;
  private detailsElement: HTMLDetailsElement | null = null;
  private animationFrame: number | null = null;
  private currentProgress: number = 0;
  private targetProgress: number = 0;

  private getHeaderOffset(): number {
    if (typeof window === "undefined") return 80;
    const headerHeight = getComputedStyle(document.documentElement).getPropertyValue(
      "--header-height",
    );
    return parseInt(headerHeight, 10) || 70;
  }

  private buildRegions(): void {
    const all = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".prose :is(h2, h3, h4, h5, h6), prose-content :is(h2, h3, h4, h5, h6)",
      ),
    );

    this.headings = all.filter((h) => h.id);
    if (this.headings.length === 0) {
      this.regions = [];
      return;
    }

    this.regions = this.headings.map((heading, idx) => {
      const next = this.headings[idx + 1];
      return {
        id: heading.id,
        start: heading.offsetTop,
        end: next ? next.offsetTop : document.body.scrollHeight,
      };
    });
  }

  private updateLinks(activeId: string): void {
    const links = document.querySelectorAll<HTMLElement>("[data-heading-link]");
    for (const link of links) {
      const id = link.getAttribute("data-heading-link");
      if (id && id === activeId) {
        link.setAttribute("data-active", "true");
      } else {
        link.removeAttribute("data-active");
      }
    }
  }

  private updateSectionTitle(activeHeading: HTMLElement | null): void {
    if (!this.currentSectionText) return;
    if (activeHeading) {
      const firstTextNode = activeHeading.childNodes[0]?.textContent?.trim();
      const cleanText =
        firstTextNode || activeHeading.textContent?.replace(/#$/, "").trim() || "目錄";
      this.currentSectionText.textContent = cleanText;
    } else {
      this.currentSectionText.textContent = "目錄";
    }
  }

  private updateProgress(): void {
    if (!this.progressCircle) return;
    const { scrollY, innerHeight } = window;
    const { scrollHeight } = document.documentElement;
    const maxScroll = scrollHeight - innerHeight;
    this.targetProgress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;

    if (!this.animationFrame) {
      this.animateProgress();
    }
  }

  private animateProgress = (): void => {
    if (!this.progressCircle) {
      this.animationFrame = null;
      return;
    }

    const diff = this.targetProgress - this.currentProgress;
    if (Math.abs(diff) < 0.001) {
      this.currentProgress = this.targetProgress;
      this.applyProgress();
      this.animationFrame = null;
      return;
    }

    this.currentProgress += diff * 0.15;
    this.applyProgress();
    this.animationFrame = requestAnimationFrame(this.animateProgress);
  };

  private applyProgress(): void {
    if (!this.progressCircle) return;
    const offset = TOCController.CIRCUMFERENCE * (1 - this.currentProgress);
    this.progressCircle.style.strokeDashoffset = offset.toString();

    const host = this.progressCircle.closest("[role='progressbar']");
    if (host) {
      host.setAttribute("aria-valuenow", Math.round(this.currentProgress * 100).toString());
    }
  }

  private handleScroll = (): void => {
    this.updateProgress();

    if (this.regions.length === 0) return;

    const scrollY = window.scrollY;
    const offset = this.getHeaderOffset() + 20;
    const currentPos = scrollY + offset;

    let activeRegion = this.regions[0];
    let found = false;

    if (scrollY < (this.regions[0]?.start ?? 0) - offset) {
      if (this.activeId !== "") {
        this.activeId = "";
        this.updateLinks("");
        this.updateSectionTitle(null);
      }
      return;
    }

    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      if (currentPos >= region.start && currentPos < region.end) {
        activeRegion = region;
        found = true;
        break;
      }
    }

    if (!found && currentPos >= (this.regions[this.regions.length - 1]?.start ?? 0)) {
      activeRegion = this.regions[this.regions.length - 1];
    }

    if (activeRegion && activeRegion.id !== this.activeId) {
      this.activeId = activeRegion.id;
      this.updateLinks(this.activeId);
      const activeHeading = this.headings.find((h) => h.id === this.activeId) || null;
      this.updateSectionTitle(activeHeading);
    }
  };

  private handleResize = (): void => {
    this.buildRegions();
    this.handleScroll();
  };

  init(): void {
    this.cleanup();

    this.progressCircle = document.querySelector<SVGCircleElement>("#toc-progress-circle");
    this.currentSectionText = document.getElementById("toc-current-section");
    this.detailsElement = document.querySelector<HTMLDetailsElement>("#page-toc-container details");

    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = TOCController.CIRCUMFERENCE.toString();
      this.progressCircle.style.strokeDashoffset = TOCController.CIRCUMFERENCE.toString();
      this.updateProgress();
    }

    const allLinks = document.querySelectorAll<HTMLElement>("[data-heading-link]");
    allLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (this.detailsElement) {
          this.detailsElement.open = false;
        }
        setTimeout(() => this.updateProgress(), 100);
      });
    });

    this.buildRegions();
    if (this.headings.length === 0) return;

    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("resize", this.handleResize, { passive: true });
    this.handleScroll();
  }

  cleanup(): void {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleResize);
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.headings = [];
    this.regions = [];
    this.activeId = "";
    this.progressCircle = null;
    this.currentSectionText = null;
    this.detailsElement = null;
    this.currentProgress = 0;
    this.targetProgress = 0;
  }
}
