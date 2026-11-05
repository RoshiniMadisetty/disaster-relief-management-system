// cols: [[heading, key], ...]   actions: optional (row) => JSX
export default function Table({ cols, rows, actions }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>{cols.map(([h]) => <th key={h}>{h}</th>)}{actions && <th />}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map(([h, k]) => <td key={h}>{String(r[k] ?? '')}</td>)}
              {actions && <td>{actions(r)}</td>}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={cols.length + 1}>No records found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
