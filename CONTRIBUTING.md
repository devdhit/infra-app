# Contributing to Infra App

Thank you for your interest in contributing to Infra App! We welcome contributions from the community and are excited to collaborate with you.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Style Guides](#style-guides)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to contact@example.com.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create your feature branch
5. Make your changes
6. Push to the branch
7. Create a pull request

## How to Contribute

### Issues

Feel free to submit issues and enhancement requests. Before creating a new issue, please check if one already exists. When creating an issue, please provide:

- A clear and descriptive title
- A detailed description of the issue or enhancement
- Steps to reproduce (if applicable)
- Expected vs actual behavior
- Screenshots (if applicable)

### Code Contributions

1. **Find an issue** to work on or create a new one
2. **Comment** on the issue to let others know you're working on it
3. **Fork** the repository
4. **Create a branch** from `main` with a descriptive name (e.g., `feature/user-authentication` or `fix/login-error`)
5. **Make your changes**, following our style guides
6. **Add tests** if applicable
7. **Ensure all tests pass**
8. **Commit** your changes using conventional commit messages
9. **Push** to your fork
10. **Open a pull request** targeting the `main` branch

## Development Setup

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm or yarn
- PostgreSQL database
- Redis server

### Installation

1. Fork and clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (copy `.env.example` to `.env` and configure)
4. Run database migrations:
   ```
   npx prisma migrate dev
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - :art: `:art:` when improving the format/structure of the code
  - :racehorse: `:racehorse:` when improving performance
  - :non-potable_water: `:non-potable_water:` when plugging memory leaks
  - :memo: `:memo:` when writing docs
  - :bug: `:bug:` when fixing a bug
  - :fire: `:fire:` when removing code or files
  - :green_heart: `:green_heart:` when fixing the CI build
  - :white_check_mark: `:white_check_mark:` when adding tests
  - :lock: `:lock:` when dealing with security
  - :arrow_up: `:arrow_up:` when upgrading dependencies
  - :arrow_down: `:arrow_down:` when downgrading dependencies

### TypeScript/JavaScript Style Guide

- Follow the existing code style
- Use TypeScript for all new code
- Ensure type safety
- Write JSDoc/TSdoc comments for functions, classes, and complex logic
- Keep functions small and focused
- Avoid deeply nested code

### CSS Style Guide

- Use Tailwind CSS utility classes
- Follow the existing class naming conventions
- Mobile-first responsive design

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build
2. Update the README.md with details of changes to the interface, including new environment variables, exposed ports, useful file locations and container parameters
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/)
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you

## Reporting Issues

### Before Submitting an Issue

1. Check the documentation
2. Perform a search of existing issues
3. Try to reproduce the issue in the latest version

### When Submitting an Issue

Include the following information:

1. **Summary**: A brief description of the issue
2. **Steps to Reproduce**: Clear, numbered steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: Operating system, browser, version, etc.
6. **Screenshots**: If applicable
7. **Logs**: Any relevant error messages or logs

## Community

- Join our discussions on [platform]
- Follow us on [social media platforms]
- Attend our community meetings (link to calendar)

Thank you for contributing to Infra App!