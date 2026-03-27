// Parse accuracy benchmark against real-world Ruby projects
// Downloads files from GitHub and measures error-free line percentage

import {rubyLanguage} from "../dist/index.js"
const parser = rubyLanguage.parser

const FILES = [
  {
    project: "Fastlane",
    file: "runner.rb",
    url: "https://raw.githubusercontent.com/fastlane/fastlane/master/fastlane/lib/fastlane/runner.rb",
  },
  {
    project: "Grape",
    file: "api.rb",
    url: "https://raw.githubusercontent.com/ruby-grape/grape/master/lib/grape/api.rb",
  },
  {
    project: "Jekyll",
    file: "site.rb",
    url: "https://raw.githubusercontent.com/jekyll/jekyll/master/lib/jekyll/site.rb",
  },
  {
    project: "Devise",
    file: "devise.rb",
    url: "https://raw.githubusercontent.com/heartcombo/devise/main/lib/devise.rb",
  },
  {
    project: "Sidekiq",
    file: "config.rb",
    url: "https://raw.githubusercontent.com/sidekiq/sidekiq/main/lib/sidekiq/config.rb",
  },
  {
    project: "Rails",
    file: "query_methods.rb",
    url: "https://raw.githubusercontent.com/rails/rails/main/activerecord/lib/active_record/relation/query_methods.rb",
  },
  {
    project: "Faker",
    file: "internet.rb",
    url: "https://raw.githubusercontent.com/faker-ruby/faker/main/lib/faker/default/internet.rb",
  },
]

async function fetchFile(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return await res.text()
}

function measureAccuracy(code) {
  const tree = parser.parse(code)
  const lines = code.split("\n")
  const totalLines = lines.length

  // Find which lines contain error nodes
  const errorLines = new Set()
  tree.iterate({
    enter(node) {
      if (node.type.isError) {
        // Mark all lines this error spans
        const startLine = code.slice(0, node.from).split("\n").length
        const endLine = code.slice(0, node.to).split("\n").length
        for (let i = startLine; i <= endLine; i++) {
          errorLines.add(i)
        }
      }
    },
  })

  const cleanLines = totalLines - errorLines.size
  const accuracy = (cleanLines / totalLines) * 100
  return { totalLines, errorLines: errorLines.size, cleanLines, accuracy }
}

console.log("Fetching files and measuring parse accuracy...\n")

const results = []
for (const entry of FILES) {
  try {
    const code = await fetchFile(entry.url)
    const stats = measureAccuracy(code)
    results.push({ ...entry, ...stats })
    console.log(
      `${entry.project.padEnd(12)} ${entry.file.padEnd(22)} ${String(stats.totalLines).padStart(5)} lines  ${stats.accuracy.toFixed(1)}%`
    )
  } catch (e) {
    console.log(`${entry.project.padEnd(12)} FAILED: ${e.message}`)
  }
}

// Sort by accuracy descending
results.sort((a, b) => b.accuracy - a.accuracy)

console.log("\n--- README table (sorted by accuracy) ---\n")
console.log("| Project | File | Lines | Accuracy |")
console.log("|---------|------|-------|----------|")
for (const r of results) {
  console.log(
    `| ${r.project} | ${r.file} | ${r.totalLines} | **${r.accuracy.toFixed(1)}%** |`
  )
}
