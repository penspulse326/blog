export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-empty": [2, "never"],
    "scope-empty": [2, "always"],
  },
};
