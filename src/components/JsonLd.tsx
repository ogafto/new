// Dane strukturalne (schema.org) — pomagają Google zrozumieć stronę. „<” zamieniane, żeby nie dało się wstrzyknąć HTML.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
