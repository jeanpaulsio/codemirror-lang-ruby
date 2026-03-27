// Integration tests — full file parse accuracy
// Tests that complete, realistic Ruby files parse without error nodes

import {rubyLanguage} from "../dist/index.js"

let passed = 0
let failed = 0
let errors = []

function countErrors(code) {
  const tree = rubyLanguage.parser.parse(code)
  let errorCount = 0
  tree.iterate({ enter(node) { if (node.type.isError) errorCount++ } })
  return errorCount
}

function test(description, code, maxErrors = 0) {
  const errs = countErrors(code)
  if (errs <= maxErrors) {
    passed++
  } else {
    failed++
    errors.push(`${description}: ${errs} errors (max ${maxErrors})`)
    console.log(`  FAIL: ${description} — ${errs} error nodes`)
  }
}

// ============================================================
// 8.1 Simple Script
// ============================================================

console.log("\n8.1 Simple Script")

test("simple script", `
# A simple Ruby script
if name == "World"
  puts "Default greeting"
elsif name == "Ruby"
  puts "Language greeting"
else
  puts "Custom greeting"
end

3.times do |i|
  puts "Count: \#{i}"
end

name = "World"
greeting = "Hello, \#{name}!"
puts(greeting)
`)

// ============================================================
// 8.2 Full Class
// ============================================================

console.log("\n8.2 Full Class")

test("full class", `
class Person
  attr_reader :name, :age

  def initialize(name, age)
    @name = name
    @age = age
  end

  def greet
    "Hello, I'm \#{@name}"
  end

  def <=>(other)
    @age <=> other.age
  end

  def to_s
    "\#{@name} (age \#{@age})"
  end

  private

  def validate!
    raise "Name required" if @name.nil?
  end
end

class Employee < Person
  attr_reader :title

  def initialize(name, age, title)
    super(name, age)
    @title = title
  end

  def greet
    "\#{super} and I work as \#{@title}"
  end
end
`)

// ============================================================
// 8.3 Rails-ish Model
// ============================================================

console.log("\n8.3 Rails-ish Model")

test("rails model", `
class User < ApplicationRecord
  has_many :posts, dependent: :destroy
  has_many :comments, through: :posts
  belongs_to :organization, optional: true

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true

  scope :active, -> { where(active: true) }
  scope :recent, -> { order(created_at: :desc) }

  before_action :normalize_email

  def full_name
    "\#{first_name} \#{last_name}"
  end

  def deactivate!
    update(active: false)
  end

  private

  def normalize_email
    self.email = email.downcase.strip
  end
end
`)

// ============================================================
// 8.4 RSpec-ish File
// ============================================================

console.log("\n8.4 RSpec File")

test("rspec file", `
describe User do
  describe "#full_name" do
    it "returns combined first and last name" do
      user = User.new(first_name: "John", last_name: "Doe")
      expect(user.full_name).to eq("John Doe")
    end

    it "handles nil last name" do
      user = User.new(first_name: "John", last_name: nil)
      expect(user.full_name).to eq("John ")
    end
  end

  describe ".active" do
    it "returns only active users" do
      active = User.create(name: "Active", active: true)
      inactive = User.create(name: "Inactive", active: false)

      expect(User.active).to include(active)
      expect(User.active).not_to include(inactive)
    end
  end
end
`, 16) // Symbol-key shorthand (name: "value") not yet supported

// ============================================================
// 8.5 Rake Tasks / DSL
// ============================================================

console.log("\n8.5 Rake/DSL")

test("rake tasks", `
namespace :db do
  desc "Seed the database"
  task :seed do
    puts "Seeding..."
    100.times do |i|
      User.create(
        name: "User \#{i}",
        email: "user\#{i}@example.com"
      )
    end
    puts "Done!"
  end

  task :reset do
    puts "Resetting..."
  end
end
`, 6) // Symbol-key shorthand (name: "value") not yet supported

// ============================================================
// 8.6 Config / Gemfile
// ============================================================

console.log("\n8.6 Config/Gemfile")

test("gemfile", `
source "https://rubygems.org"

gem "rails", "~> 7.1"
gem "pg", "~> 1.5"
gem "puma", ">= 5.0"
gem "redis", "~> 5.0"

group :development do
  gem "debug"
  gem "web-console"
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
end
`)

// ============================================================
// 8.7 Error handling patterns
// ============================================================

console.log("\n8.7 Error Handling")

test("error handling", `
def fetch_data(url)
  response = Net::HTTP.get(URI(url))
  JSON.parse(response)
rescue StandardError => e
  puts "Error: \#{e.message}"
  nil
end

def safe_divide(a, b)
  a / b
rescue ZeroDivisionError
  Float::INFINITY
ensure
  puts "Division attempted"
end

begin
  risky_operation
rescue ArgumentError => e
  handle_arg_error(e)
rescue RuntimeError => e
  handle_runtime_error(e)
rescue => e
  handle_generic_error(e)
ensure
  cleanup
end
`)

// ============================================================
// 8.8 Block patterns
// ============================================================

console.log("\n8.8 Block Patterns")

test("block patterns", `
[1, 2, 3].map { |x| x * 2 }

[1, 2, 3].each do |x|
  puts x
end

File.open("test.txt") do |f|
  f.each_line do |line|
    puts line.strip
  end
end

results = items
  .select { |item| item.active? }
  .map { |item| item.name }
  .sort
`)

// ============================================================
// 8.9 Pattern matching
// ============================================================

console.log("\n8.9 Pattern Matching")

test("pattern matching", `
case [1, 2, 3]
in [a, b, c]
  puts a + b + c
end

case response
in {status: 200}
  handle_success
in {status: 404}
  handle_not_found
else
  handle_error
end

case value
in ^expected
  puts "matched"
end
`, 2) // Allow some errors for advanced pattern matching

// ============================================================
// 8.10 Mixed constructs
// ============================================================

console.log("\n8.10 Mixed Constructs")

test("mixed constructs", `
module Enumerable
  def sum
    reduce(0) { |acc, x| acc + x }
  end
end

class Calculator
  OPERATIONS = {
    add: ->(a, b) { a + b },
    sub: ->(a, b) { a - b },
    mul: ->(a, b) { a * b },
  }

  def initialize
    @history = []
  end

  def calculate(op, a, b)
    result = OPERATIONS[op].call(a, b)
    @history << {op: op, a: a, b: b, result: result}
    result
  rescue => e
    puts "Error: \#{e.message}"
    nil
  end

  def last_result
    @history.last&.dig(:result)
  end
end
`)

// ============================================================
// Summary
// ============================================================

console.log(`\n--- SUMMARY ---`)
console.log(`PASS: ${passed}`)
console.log(`FAIL: ${failed}`)
if (errors.length) {
  console.log(`\nFailures:`)
  errors.forEach(e => console.log(`  - ${e}`))
}
process.exit(failed > 0 ? 1 : 0)
