module.exports = {
  ci: {
    collect: {
      startServerCommand: "DISABLE_AUTH=1 npm start",
      startServerReadyPattern: "Ready in",
      url: ["http://localhost:3000/"],
      numberOfRuns: 1,
      settings: {
        onlyCategories: ["accessibility"],
        chromeFlags: "--no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
