<a name="readme-top"></a>

# Email Worker

<p align="center">
  A worker service for performing CRUD operations on emails and sending emails via SMTP, using Resend as the email sender.
  <br />
  <a href="https://github.com/eujuliu/email-serverless/issues">Have a question?</a>
  ·
  <a href="https://github.com/eujuliu/email-serverless/fork">Request Feature</a>
</p>

<ul>
  <li>
    <a href="#technologies">Technologies</a>
  </li>
  <li>
    <a href="#getting-started">Getting Started</a>
    <ul>
      <li><a href="#prerequisites">Prerequisites</a></li>
      <li><a href="#installation">Installation</a></li>
      <li><a href="#usage">Usage</a></li>
    </ul>
  </li>
  <li><a href="#contributing">Contributing</a></li>
  <li><a href="#author">Author</a></li>
</ul>

## Technologies

This project was built using the `Node.js` runtime with `TypeScript` for type safety. It uses the `Hono` framework for building the API, `Nodemailer` for sending emails via SMTP (with Resend as the provider), `AMQP` (via `amqplib`) for message queuing, `Redis` for caching, and `PostgreSQL` for database operations. Testing is handled with `Vitest`, linting and formatting with `Biome`, and building with `tsup`. Additional tools include `Husky` for Git hooks and `lint-staged` for pre-commit checks.

## Getting Started

### Prerequisites

For running this project, you will need the following:

- [Node.js](https://nodejs.org/en)
- [NPM](https://www.npmjs.com/) or [PNPM](https://pnpm.io/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

And you need to download the project to your computer.

### Installation

After fulfilling all requirements, install the dependencies:

```bash
npm install
# or
pnpm install
```

### Usage

To use the project, you can run the following commands from the `package.json` scripts:

- To run in development mode with hot reloading:

  ```bash
  npm run dev
  # or
  pnpm run dev
  ```

- To build for Node.js:

  ```bash
  npm run build:node
  # or
  pnpm run build:node
  ```

- To build for AWS Lambda:

  ```bash
  npm run build:lambda
  # or
  pnpm run build:lambda
  ```

- To start the Node.js build:

  ```bash
  npm run start:node
  # or
  pnpm run start:node
  ```

- To start the Lambda build:

  ```bash
  npm run start:lambda
  # or
  pnpm run start:lambda
  ```

- For development with Docker Compose:

  ```bash
  npm run docker:dev
  # or
  pnpm run docker:dev
  ```

- To run tests:

  ```bash
  npm run test
  # or
  pnpm run test
  ```

- To lint the code:

  ```bash
  npm run lint
  # or
  pnpm run lint
  ```

## Contributing

If you'd like to contribute to this project, please follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b feat/your-feature`.
3. Make your changes and commit them: `git commit -m 'Add some feature'`.
4. Push to the original branch: `git push origin feat/your-feature`.
5. Create a pull request.

## Author

<img style="border-radius: 50%;" src="https://avatars.githubusercontent.com/u/49854105?v=4" width="100px;" alt=""/>
<br />
<sub><b>Julio Martins</b></sub></a>

Made by Julio Martins 👋🏽 Contact me!

[![Linkedin Badge](https://img.shields.io/badge/-@ojuliomartins-1262BF?style=for-the-badge&labelColor=1262BF&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ojuliomartins/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
