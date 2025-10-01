FROM public.ecr.aws/lambda/nodejs:22 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS builder

WORKDIR /app

COPY . .
RUN CI=true pnpm install --frozen-lockfile
RUN CI=true pnpm run build:lambda

FROM base AS installer

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
RUN CI=true pnpm install --frozen-lockfile --prod --ignore-scripts

FROM public.ecr.aws/lambda/nodejs:22 AS runner

WORKDIR ${LAMBDA_TASK_ROOT}

COPY --from=builder /app/dist/ ./dist
COPY --from=installer /app/node_modules ./node_modules

CMD ["dist/lambda.handler"]
