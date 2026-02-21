# Feature Structure

Use this structure for each new feature:

- `types.ts`: feature domain and payload types
- `service.ts`: data access and side-effect calls
- `useFeatureName.ts`: state and orchestration hook
- `components/`: presentational pieces only
- `index.ts`: public exports for easy imports

Guideline:
- Keep pages thin. Let pages compose hooks and components.
- Keep API/database logic out of page files.
- Keep components focused on rendering and interaction.
