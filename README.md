## NOTES

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# for the dev build
npm run build
# for the production build
npm run start
# to start the production build
```

The server requires two .env configuration files:

.env.development
```ts
NEXTAUTH_URL=http://localhost:<port number>/api/auth
NEXTSCRIPT_URL=http://localhost:<port number>
DB_USERNAME=<user name>
DB_PASSWORD=<password>
DB_URL=127.0.0.1:27017/?authSource=<name>
DB_NAME=notes-dev
```
.env.production
```ts
NEXTAUTH_URL=http://localhost:<port number>/api/auth
NEXTSCRIPT_URL=http://localhost:<port number>
DB_USERNAME=<user name>
DB_PASSWORD=<password>
DB_URL=127.0.0.1:27017/?authSource=<name>
DB_NAME=notes-prod
```

Open [http://localhost:3003](http://localhost:3003) with your browser to see the result.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## About

This is a note taking app. The notes can be written using [Markdown](https://www.markdownguide.org/).

# Folders

Folders can be created for organising the Notes. The name and colour of these Folders can be updated. Empty Folders can be deleted. The Notes within a Folder can be moved to other Folders.
To create a Folder select the **Add Notebook** button on the Notebooks page. An "Add Folder" dialogue box will appear. Add the Notebook name and colour and select the **Add Notebook** button to create the new Folder.

# Notes

To create a new Note select the Notebook where that Note will be stored and then select the **Add Note** button. An empty Note will be created within the current Folder. Enter Markdown into the empty Note and then select the **Create Note** button.

By default the notes are displayed as rendered Markdown. The notes can be edited by selecting the **Edit** button which will display the unrendered Markdown. Selecting the **View** button will display the rendered Markdown.

To move a Note or Notes from a Folder select the **Edit Notes** button. All the Notes within that folder will become selectable. Select those Notes which you want to move and then select the **Move** button. A dialogue box will appear with a dropdown list showing all available Notebooks. Select the destination Notebook and then select the **Move Note/s** button.

To delete a Note or Notes from a folder select the **Edit Notes** button. All the notes within that folder will become selectable. Select those Notes which you want to delete and then select the **Delete** button. The selected N otes will be deleted.

The Notebooks and the Notes in a Notebook are displayed in the order which they were updated.
