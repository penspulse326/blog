// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Penspulse",
  tagline: "前端筆記",
  favicon: "img/favicon.ico",
  url: "https://penspulse326.github.io/",
  baseUrl: "/",
  organizationName: "penspulse326",
  projectName: "penspulse326.github.io",
  deploymentBranch: "gh-pages",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "zh-Hant",
    locales: ["zh-Hant", "en"],
  },

  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
        gtag: {
          trackingID: "G-CW2LGTM5N5",
          anonymizeIP: true,
        },
        sitemap: {
          changefreq: "weekly",
          priority: 0.5,
          ignorePatterns: ["/tags/**"],
          filename: "sitemap.xml",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "img/docusaurus-social-card.jpg",
      navbar: {
        title: "Penspulse",
        logo: {
          alt: "My Site Logo",
          src: "img/logo.png",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "tutorialSidebar",
            position: "left",
            label: "筆記",
          },
          { to: "/blog", label: "學習日記", position: "left" },
          { to: "/blog/tags", label: "文章標籤", position: "left" },
          {
            href: "https://github.com/penspulse326",
            label: "Github",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      metadata: [
        {
          name: "keywords",
          content:
            "前端, 網頁前端, 前端開發, JavaScript, React.js, front end, web design, penspulse",
        },
        {
          name: "google-site-verification",
          content: "y1fosEIPhMHBWjB5UUareJqGdW8985Ce21yBQrSRPvs",
        },
        {
          name: "robots",
          content: "max-image-preview:standard",
        },
      ],
      colorMode: {
        defaultMode: "dark",
        disableSwitch: true,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
