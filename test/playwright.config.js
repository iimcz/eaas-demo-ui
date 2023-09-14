import { env } from "node:process";
import { defineConfig, devices } from "@playwright/test";

const {
    baseURL = "http://localhost",
    trace = "on-first-retry",
    debug,
    CI,
} = Object.fromEntries(Object.entries(env).filter(([_, v]) => v));
const headless = !debug;

export default defineConfig({
    testDir: "tests",
    timeout: 600 * 1000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: true,
    forbidOnly: !!CI,
    retries: CI ? 1 : 0,
    workers: CI ? 1 : undefined,
    reporter: [
        ["html", { outputFolder: "html-report" }],
        ["json", { outputFile: "json-report.json" }],
        ...(CI ? [["github"]] : []),
    ],
    use: {
        actionTimeout: 0,
        baseURL: new URL(baseURL).origin,
        trace,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"], headless },
        },

        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"], headless },
        },

        {
            name: "webkit",
            use: { ...devices["Desktop Safari"], headless },
        },
    ],
    outputDir: "test-results/",
});
