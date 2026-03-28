FROM denoland/deno:alpine-2.1.4

WORKDIR /app
COPY worker.ts .

# Pre-cache dependencies
RUN deno cache worker.ts

EXPOSE 8000
CMD ["deno", "run", "--allow-all", "worker.ts"]
