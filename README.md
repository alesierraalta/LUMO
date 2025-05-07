# Next.js Inventory App

A modern inventory management application built with Next.js, Prisma, and PostgreSQL.

## Quick Setup (Windows)

For Windows users, we've provided batch files to simplify setup and management:

1. **First-time setup**: Run `setup.bat` to install dependencies and set up the database.
2. **Start development server**: Run `start.bat` to start the Next.js development server.
3. **Production deployment**: Run `build-and-start.bat` to build and start the production server.
4. **Application management**: Run `manage.bat` for an interactive menu with all operations.

## Manual Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables in `.env`
4. Generate Prisma client:
   ```
   npx prisma generate
   ```
5. Push the database schema:
   ```
   npx prisma db push
   ```

### Development

Start the development server:

```
npm run dev
```

Visit http://localhost:3000 to see the application.

### Production

Build the application:

```
npm run build
```

Start the production server:

```
npm run start
```

## Features

- Inventory tracking and management
- Product categorization
- Stock level monitoring
- Sales tracking
- Reporting tools

## License

[MIT](LICENSE)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
