import { Section, Group } from "./Section.jsx"

const PALETTE = [
  ["--smart-blue", "#0466c8", "Main interaction"],
  ["--sapphire", "#0353a4", "Hover / selected text"],
  ["--regal-navy", "#023e7d", "Pressed / strong brand"],
  ["--prussian-blue", "#002855", "Deep dark surface"],
  ["--prussian-blue-2", "#001845", "Dark surface"],
  ["--prussian-blue-3", "#001233", "Dark canvas"],
  ["--twilight-indigo", "#33415c", "Dark borders"],
  ["--blue-slate", "#5c677d", "Secondary text"],
  ["--slate-grey", "#7d8597", "Muted text"],
  ["--lavender-grey", "#979dac", "Disabled / supporting"],
]

const SEMANTIC = [
  ["--text-primary", "Text"],
  ["--text-secondary", "Text"],
  ["--text-muted", "Text"],
  ["--text-disabled", "Text"],
  ["--surface-base", "Surface"],
  ["--surface-sidebar", "Surface"],
  ["--surface-canvas", "Surface"],
  ["--surface-page", "Surface"],
  ["--surface-toolbar", "Surface"],
  ["--surface-raised", "Surface"],
  ["--surface-hover", "Surface"],
  ["--surface-selected", "Surface"],
  ["--border-subtle", "Border"],
  ["--border-default", "Border"],
  ["--border-strong", "Border"],
  ["--accent", "Accent"],
  ["--accent-subtle", "Accent"],
  ["--conflict-line", "Conflict"],
  ["--conflict-tint", "Conflict"],
  ["--grammar-line", "Grammar"],
  ["--grammar-tint", "Grammar"],
  ["--success", "Status"],
  ["--warning", "Status"],
  ["--danger", "Status"],
  ["--collab-eshaal", "Collaborator"],
  ["--collab-atika", "Collaborator"],
  ["--collab-ibrahim", "Collaborator"],
]

const TYPE = [
  ["Page heading", "--text-3xl / 400", { fontSize: "var(--text-3xl)" }, "Welcome, Eshaal"],
  ["Section heading", "--text-xl / 500", { fontSize: "var(--text-xl)", fontWeight: 500 }, "Recent documents"],
  ["Subsection", "--text-lg / 500", { fontSize: "var(--text-lg)", fontWeight: 500 }, "People with access"],
  ["Body / toolbar", "--text-md / 400", { fontSize: "var(--text-md)" }, "Concurrent edits stay synchronized using CRDTs."],
  ["Metadata", "--text-sm / 400", { fontSize: "var(--text-sm)", color: "var(--text-secondary)" }, "Opened today at 8:59 PM · Owned by me"],
  ["Helper", "--text-xs / 400", { fontSize: "var(--text-xs)", color: "var(--text-secondary)" }, "Semantic suggestions are advisory."],
  ["Document body", "--font-doc 15 / 1.6", { fontFamily: "var(--font-doc)", fontSize: "var(--text-base)", lineHeight: 1.6 }, "The company expects stable revenue growth next quarter."],
]

const SPACE = [1, 2, 3, 4, 5, 6, 8, 10, 12]

export function Foundations() {
  return (
    <>
      <Section id="color" title="Color" lead="A single blue family drives interaction. Conflict is muted coral and grammar is muted violet; both appear as underlines, never banners.">
        <Group title="Palette">
          <div className="ds-swatches">
            {PALETTE.map(([token, hex, role]) => (
              <div className="ds-swatch" key={token}>
                <div className="ds-swatch-chip" style={{ background: `var(${token})` }} />
                <code>{token}</code>
                <span>{hex} · {role}</span>
              </div>
            ))}
          </div>
        </Group>
        <Group title="Semantic tokens (switch theme to compare)">
          <div className="ds-swatches">
            {SEMANTIC.map(([token, group]) => (
              <div className="ds-swatch" key={token}>
                <div className="ds-swatch-chip" style={{ background: `var(${token})` }} />
                <code>{token}</code>
                <span>{group}</span>
              </div>
            ))}
          </div>
        </Group>
      </Section>

      <Section id="typography" title="Typography" lead="Google Sans → Roboto → Arial for the interface; Arial for document content, matching familiar editors. Hierarchy comes from size and weight, not bold everywhere.">
        <div>
          {TYPE.map(([name, spec, style, sample]) => (
            <div className="ds-type-row" key={name}>
              <div>
                <div>{name}</div>
                <code>{spec}</code>
              </div>
              <div style={style}>{sample}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="spacing" title="Spacing, radius, elevation" lead="4px base unit. Shadows only on floating layers. Buttons and icon buttons are fully rounded as in Docs; containers keep small radii.">
        <div className="ds-split">
          <Group title="Spacing scale">
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              {SPACE.map(n => (
                <div className="ds-space" key={n}>
                  <code>--space-{n}</code>
                  <span className="ds-caption">{n * 4}px</span>
                  <span className="ds-space-bar" style={{ width: `var(--space-${n})` }} />
                </div>
              ))}
            </div>
          </Group>
          <Group title="Radius & elevation">
            <table className="ds-token-table">
              <thead>
                <tr><th>Token</th><th>Use</th><th /></tr>
              </thead>
              <tbody>
                <tr><td><code>--radius-sm</code></td><td>Menu items, tooltips</td><td><div className="ds-radius-chip" style={{ borderRadius: "var(--radius-sm)" }} /></td></tr>
                <tr><td><code>--radius-md</code></td><td>Inputs, selects</td><td><div className="ds-radius-chip" style={{ borderRadius: "var(--radius-md)" }} /></td></tr>
                <tr><td><code>--radius-lg</code></td><td>Menus, popovers, dialogs</td><td><div className="ds-radius-chip" style={{ borderRadius: "var(--radius-lg)" }} /></td></tr>
                <tr><td><code>--shadow-popover</code></td><td>Menus, popovers, toasts</td><td><div className="ds-shadow-chip" style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-popover)" }} /></td></tr>
                <tr><td><code>--shadow-dialog</code></td><td>Dialogs only</td><td><div className="ds-shadow-chip" style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-dialog)" }} /></td></tr>
              </tbody>
            </table>
          </Group>
        </div>
        <div className="ds-split">
          <Group title="Control heights">
            <table className="ds-token-table">
              <tbody>
                <tr><td><code>--control-h-sm</code></td><td>28px · toolbar items</td></tr>
                <tr><td><code>--control-h-md</code></td><td>32px · icon buttons, menu items, sidebar</td></tr>
                <tr><td><code>--control-h</code></td><td>36px · inputs, buttons</td></tr>
                <tr><td><code>--control-h-lg</code></td><td>40px · primary auth actions, toolbar bar</td></tr>
                <tr><td><code>--row-h</code></td><td>48px · document rows</td></tr>
                <tr><td><code>--appbar-h</code></td><td>56px · editor title area</td></tr>
              </tbody>
            </table>
          </Group>
          <Group title="Z-index & motion">
            <table className="ds-token-table">
              <tbody>
                <tr><td><code>--z-sticky / toolbar</code></td><td>10 / 20</td></tr>
                <tr><td><code>--z-dropdown / popover</code></td><td>30 / 40</td></tr>
                <tr><td><code>--z-modal / toast</code></td><td>50 / 60</td></tr>
                <tr><td><code>--motion-instant</code></td><td>80ms</td></tr>
                <tr><td><code>--motion-fast</code></td><td>120ms · hover, color</td></tr>
                <tr><td><code>--motion-normal</code></td><td>160ms · panels, popover opacity</td></tr>
              </tbody>
            </table>
            <p className="ds-caption" style={{ marginTop: "var(--space-2)" }}>
              Transitions name their properties; never <code>transition: all</code>. Reduced motion removes them.
            </p>
          </Group>
        </div>
      </Section>
    </>
  )
}
