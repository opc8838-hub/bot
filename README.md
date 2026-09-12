# bloub

> **This is a fork — a secondary development.** It is based on
> [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub) by Jérémy Perret,
> MIT licensed. The original design, the frame-by-frame measurements taken off the
> reference video, and the rendering engine are all upstream's work and remain
> theirs. See [What this fork changes](#what-this-fork-changes) for the short list
> of differences.
>
> 本项目是 [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub) 的**二次开发**，
> 原作者为 Jérémy Perret，MIT 许可协议。原始设计、参考视频的逐帧测量数据、以及
> 渲染引擎均来自上游项目，版权与功劳归原作者所有。本仓库只做了少量修改，
> 见 [What this fork changes](#what-this-fork-changes)。

An SVG recreation of the x.ai bot avatar: **one filled black shape** that morphs
between 14 states, **two white shapes** for the eyes that morph independently, on
a plain background. No animation library.

![The avatar going through idle, wink, orbit and burst](docs/demo.gif)

## Running it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5190.

```bash
pnpm test     # vitest
pnpm build    # vue-tsc --noEmit && vite build
```

Vue 3, Vite, TypeScript, Tailwind 4. No ESLint and no Prettier: `vue-tsc` is the
only gate, so run `pnpm build` before you call something done.

## What's in it

The rail on the left switches between three views. **Customise** offers 9 body
shapes, 12 colours and 16 rest expressions, kept between visits. **Animations** is
a small editor: arrange states into a timeline, set how long each is held, save the
result. **Settings** holds the language (French, English or Chinese) and the
credits.

Anything on screen can be exported: the avatar as SVG, PNG or an animated GIF, and
a whole timeline as GIF or MP4. The still formats need no library at all, and the
video encoder is only fetched the first time you ask for one.

Two URLs are worth knowing:

- `#planche`: the 14 states side by side, frozen. Quick visual check.
- `#etat=orbit&stop`: opens one state directly, playback paused.

![The 14 states, frozen side by side](docs/states.png)

## Why the numbers look arbitrary

They're measured, not chosen. The reference video was cut at 10 fps and each
state measured off the frames: silhouettes by sub-pixel ray casting, eyes by
capsule fitting, colours and stroke widths by direct sampling.

So the constants in the code are **measurements**, and rounding them to friendlier
values breaks the resemblance, which is the only thing this project is trying to
get right. A few are counter-intuitive enough to be worth knowing before you
correct anything:

| What you'd assume | What the video shows |
|---|---|
| The eyes lean `//` | They lean `\\`, around 26° off vertical |
| The body is a squircle | It's a perfect circle, radial deviation under 0.7% |
| Transitions are springs | Exponential ease-outs; the body never overshoots |
| The comet crosses the screen | The dot stays put, the trail orbits it |
| The avatar floats at rest | It doesn't. The life is gaze drift and blinking |

[docs/measurements.md](docs/measurements.md) has the rest, including how to
regenerate the extracted profiles.

## How it's put together

`src/bot/` is framework-free and clock-free: `engine.sample(t)` is a pure
function of time. Pausing, resuming, jumping to an arbitrary date and running
tests all produce the same image, which is what makes the frozen state board and
the DOM-less test suite possible.

| | |
|---|---|
| [docs/architecture.md](docs/architecture.md) | The engine, radial-profile morphing, eyes as mask holes |
| [docs/measurements.md](docs/measurements.md) | What was measured, and regenerating `profiles.ts` |
| [docs/intro.md](docs/intro.md) | The arrival sequence, and why it only plays one state |
| [docs/interface.md](docs/interface.md) | Layout, the three-column scene, CSS traps |
| [docs/export.md](docs/export.md) | Exporting to SVG, PNG, GIF and MP4 |
| [docs/i18n.md](docs/i18n.md) | The hand-rolled translation layer |

## Using the component

```vue
<BloubBot v-model:block="block" v-model:state="state" v-model:playing="playing" />
<BloubBot state="orbit" :size="120" :frozen-at="1.2" />
```

`block` is the playback cursor: a montage can play the same state twice, so the
index is what identifies where you are; `state` follows it as an output. Pass
`frozenAt` and the component renders one exact frame with no animation loop, which
is how the thumbnails and the state board are drawn.

Props: `size`, `shape`, `color`, `expression`, `paper`, `frozenAt`, `cycle`,
`follow`, `gaze`. Models: `block`, `state`, `playing`, `elapsed`. See
[BloubBot.vue](src/components/BloubBot.vue) for the details.

## Changes

[CHANGELOG.md](CHANGELOG.md), one entry per release — which is how you tell whether the
copy you have carries a given fix.

## What this fork changes

Short, and deliberate. Everything not listed here is upstream's and unmodified.

- **A poker-card body shape** (`carte`), 1:1.4 — the ratio of a real playing card
  (2.5 × 3.5 in). It is a rounded rectangle sampled to a polygon so the corners
  are true circular arcs rather than a superellipse: a superellipse hugs the
  corner point instead of rounding it, which reads as "rounded square" instead of
  "card". Labelled 扑克牌 / carte / card in the three locales.
- **A framing fix in the animated SVG export.** `versSvgAnime` was the only export
  that serialised on the tight default crop (`viewBoxExport()` → ±125) instead of
  the frame the component actually draws (`DEMI_ECRAN` → ±158). The file came out
  zoomed about 26 % against both the editor and the GIF/MP4 exports, which is why
  it did not look like the avatar you had just been watching. It now uses
  `viewBoxExport(DEMI_ECRAN)`, the same frame as `cycleVersGif` and `cycleVersMp4`.
- **A batch exporter under `tools/`**, development only and not part of the app:
  renders every colour × every expression to an animated SVG, one folder per
  colour. It lives under vitest because that is the one launcher in this repo that
  can mount a DOM, and it runs on a separate config so an ordinary `pnpm test`
  never writes those files:

  ```bash
  pnpm vitest run --config vitest.export.config.ts
  ```

## License

MIT. See [LICENSE](LICENSE) — upstream's notice, kept verbatim, as the licence
requires. The changes listed above are released under the same terms.

Not affiliated with, endorsed by or connected to x.ai. It recreates the visual
behaviour of their bot avatar as an exercise; "Grok" and "x.ai" belong to their
owners. The MIT licence covers the code in this repository, not the design it
imitates.
