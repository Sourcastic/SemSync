export function Section({ id, title, lead, children }) {
  return (
    <section className="ds-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {lead && <p>{lead}</p>}
      {children}
    </section>
  )
}

export function Group({ title, children }) {
  return (
    <div className="ds-group">
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}
