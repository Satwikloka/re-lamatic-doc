![GitHub Banner](https://github.com/lamaticai/lamaticai-docs/assets/2834609/e403ad73-73fa-43f0-9925-292b05ce58de)

# lamaticai Docs

Repo for [lamaticai.com](https://lamaticai.com), based on [Nextra](https://nextra.site/)

## Local Development

Pre-requisites: Node.js 18+, pnpm

1. Optional: Create env based on [.env.template](./.env.template)
2. Run `pnpm i` to install the dependencies.
3. Run `pnpm dev` to start the development server on localhost:3333

## Python cookbooks

All Jupyter notebooks are in the `cookbook/` directory. For JS/TS notebooks we use Deno, see Readme in cookbook folder for more details.

To render them within the documentation site, we convert them to markdown using `jupyter nbconvert`, move them to right path in the pages/ directory where they are rendered by Nextra (remark).

Steps after updating notebooks:

1. Load python shell/env which has jupyter installed, e.g. `poetry install && poetry shell`
2. Run `bash scripts/update_cookbook_docs.sh`
3. Commit the changed markdown files

## API Reference (Swagger)

API reference is automatically generated based on the OpenAPI spec of the current production deployment of lamaticai Cloud.

## Stack

- [Nextra](https://nextra.site/)
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/)

Interested in stack of Q&A docs chatbot? Checkout the [blog post](https://lamaticai.com/blog/qa-chatbot-for-lamaticai-docs) for implementation details (all open source)

## Bundle analysis

Run `pnpm run analyze` to analyze the bundle size of the production build using `@next/bundle-analyzer`.
