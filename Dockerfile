FROM node:22.14.0-alpine AS base

# Set the working directory in the container
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml (if available)
COPY ./package.json ./pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .
COPY ./tsconfig.json ./


# Expose the port the app runs on
EXPOSE 3000

# Build the application
RUN npm run build

# Command to run the application
CMD ["npx", "nest", "start", "--watch"]
# # Command to run the application in development mode
# CMD ["pnpm", "run", "start:debug"]