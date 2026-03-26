# codemirror-lang-ruby

Ruby language support for [CodeMirror 6](https://codemirror.net/), built on a [Lezer](https://lezer.codemirror.net/) grammar.

## Status

**Work in progress.** The grammar covers core Ruby constructs (classes, modules, methods, control flow, blocks, lambdas, literals). See CLAUDE.md for the full roadmap of what still needs to be built.

## Usage

```typescript
import {ruby} from "codemirror-lang-ruby"
import {EditorState} from "@codemirror/state"
import {EditorView} from "@codemirror/view"

const state = EditorState.create({
  doc: 'puts "hello"',
  extensions: [ruby()]
})
```

### Install from GitHub

```bash
npm install github:jeanpaulsio/codemirror-lang-ruby
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
