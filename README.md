This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## In-IDE Preview (VS Code)

Use this repo's built-in VS Code run configuration for one-click local preview.

1. Press `F5` (Run and Debug) and choose `Next.js: Dev (F5)`.
2. VS Code starts `npm run dev` and waits for the local URL.
3. To stop, press `Shift+F5`.

Fallback manual route:

1. Run `npm run dev`.
2. Open Command Palette (`Ctrl+Shift+P`) and run `Simple Browser: Show`.
3. Enter `http://localhost:3000`.
## Feature Template

A starter structure for clean, scalable features is available in `src/features/_template`.

- Copy `_template` to a new feature folder (for example `src/features/tasks`).
- Rename `useTemplateFeature.ts` and `TemplatePanel.tsx` to feature names.
- Keep data access in `service.ts`, types in `types.ts`, and UI in `components/`.
- Re-export public parts through `index.ts`.

Shared app-level table types are in `src/types/domain.ts`.
