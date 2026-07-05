import type { StaticPageCopy } from "@/lib/copy/static-pages";

export function StaticPage({ copy }: { copy: StaticPageCopy }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">{copy.title}</h1>
      {copy.sections.map((section, index) => (
        <section key={section.heading ?? index} className="mt-8">
          {section.heading && (
            <h2 className="font-display text-xl sm:text-2xl">{section.heading}</h2>
          )}
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-muted mt-3 leading-relaxed">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="text-muted mt-3 list-disc space-y-2 pl-6 leading-relaxed">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.email && (
            <p className="mt-3">
              <a
                href={`mailto:${section.email}`}
                className="hover:text-ink inline-flex min-h-11 items-center font-medium underline underline-offset-4"
              >
                {section.email}
              </a>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
